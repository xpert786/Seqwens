import React, { useState, useEffect, useRef } from "react";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { SaveIcon } from "../../component/icons";
import { toast } from "react-toastify";
import "../../styles/profile.css";
import { taxPreparerSettingsAPI, profileAPI, handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";

// Removed DEFAULT_AVATAR_URL - use initials placeholder instead of random avatars

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
    const [phoneCountry, setPhoneCountry] = useState('us');
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [currentProfileImage, setCurrentProfileImage] = useState(
        profileData?.profile_picture ||
        profileData?.profile_image ||
        null
    );
    const [errorMessage, setErrorMessage] = useState(null);
    const [profileImageError, setProfileImageError] = useState(false);
    const [firmInfo, setFirmInfo] = useState(null);
    const [userRole, setUserRole] = useState(null);

    // Reset image error when profile image changes
    useEffect(() => {
        setProfileImageError(false);
    }, [profileData?.profile_picture, profileData?.profile_image, imagePreview]);

    // Fetch firm information from account API
    useEffect(() => {
        const fetchFirmInfo = async () => {
            try {
                const response = await profileAPI.getUserAccount();
                let userInfo = response;
                if (response.user) {
                    userInfo = response.user;
                } else if (response.data) {
                    userInfo = response.data;
                }

                const firmData = userInfo.firm || response.firm || null;
                const primaryRole = userInfo.primary_role || userInfo.role || null;
                setFirmInfo(firmData);
                setUserRole(primaryRole);
            } catch (error) {
                console.error('Error fetching firm information:', error);
                // Don't show error toast - this is optional information
            }
        };

        fetchFirmInfo();
    }, []);

    const syncHeaderProfile = (data) => {
        if (typeof window === "undefined") return;
        if (data && typeof window.setTaxHeaderProfile === "function") {
            window.setTaxHeaderProfile(data);
        } else if (typeof window.refreshTaxHeaderProfile === "function") {
            window.refreshTaxHeaderProfile();
        }
    };

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

        const nextProfileImage =
            profileData?.profile_picture ||
            profileData?.profile_image ||
            profileData?.avatar ||
            null;

        if (nextProfileImage && nextProfileImage !== 'null' && nextProfileImage !== 'undefined') {
            setCurrentProfileImage(nextProfileImage);
        } else if (!imagePreview) {
            setCurrentProfileImage(null);
        }
    }, [profileData, companyProfile, imagePreview]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        const isValidImage =
            file.type.startsWith('image/') ||
            file.name.toLowerCase().endsWith('.avif') ||
            file.name.toLowerCase().endsWith('.webp') ||
            file.name.toLowerCase().endsWith('.heic') ||
            file.name.toLowerCase().endsWith('.heif');

        if (!isValidImage) {
            const message = 'Please select a valid image file (JPG, PNG, GIF, AVIF, WEBP, etc.)';
            setErrorMessage(message);
            toast.error(message);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            const message = `Image size should be less than ${Math.round(maxSize / (1024 * 1024))}MB`;
            setErrorMessage(message);
            toast.error(message);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        setSelectedImage(file);
        setErrorMessage(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            setImagePreview(event.target?.result || null);
        };
        reader.onerror = () => {
            setErrorMessage('Failed to load image preview');
            toast.error('Failed to load image preview');
        };
        reader.readAsDataURL(file);
    };

    const handleUploadSuccess = async (response) => {
        const isSuccess = typeof response?.success === 'boolean' ? response.success : true;
        if (!isSuccess) {
            throw new Error(response?.message || 'Failed to update profile picture');
        }

        const profilePayload =
            response?.data?.profile_information ||
            response?.data?.profile ||
            response?.profile_information ||
            response?.profile ||
            null;

        const newProfileImageUrl =
            profilePayload?.profile_picture ||
            profilePayload?.profile_image ||
            response?.data?.profile_picture ||
            response?.profile_picture ||
            response?.profile_image ||
            null;

        if (newProfileImageUrl && newProfileImageUrl !== 'null' && newProfileImageUrl !== 'undefined') {
            setCurrentProfileImage(newProfileImageUrl);
        }

        setSelectedImage(null);
        setImagePreview(null);
        setErrorMessage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        syncHeaderProfile(profilePayload || response?.data || null);
        if (onUpdate) {
            onUpdate();
        }

        toast.success('Profile picture updated successfully');
        setUploadingImage(false);
    };

    const handleImageUpload = async () => {
        if (!selectedImage) {
            const message = 'Please select an image first';
            setErrorMessage(message);
            toast.error(message);
            return;
        }

        let isAvifFile = false;
        try {
            setUploadingImage(true);
            setErrorMessage(null);

            const isAVIF =
                selectedImage.name.toLowerCase().endsWith('.avif') ||
                selectedImage.type === 'image/avif' ||
                selectedImage.type === 'image/avif-sequence';

            let fileToUpload = selectedImage;

            if (isAVIF) {
                isAvifFile = true;
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const img = new Image();
                        img.onload = async function () {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);

                            canvas.toBlob(
                                async (blob) => {
                                    if (!blob) {
                                        const message = 'Failed to convert AVIF image. Please upload a JPG or PNG file instead.';
                                        setErrorMessage(message);
                                        toast.error(message);
                                        setUploadingImage(false);
                                        return;
                                    }

                                    const convertedFile = new File([blob], selectedImage.name.replace(/\.avif$/i, '.png'), {
                                        type: 'image/png',
                                        lastModified: Date.now()
                                    });

                                    try {
                                        const response = await taxPreparerSettingsAPI.updateProfilePicture(convertedFile);
                                        await handleUploadSuccess(response);
                                    } catch (err) {
                                        console.error('Error uploading converted image:', err);
                                        const message = err.message || 'Failed to upload profile picture';
                                        setErrorMessage(message);
                                        toast.error(message);
                                        setUploadingImage(false);
                                    }
                                },
                                'image/png',
                                0.9
                            );
                        };
                        img.onerror = () => {
                            const message = 'Failed to process AVIF image. Please try another file.';
                            setErrorMessage(message);
                            toast.error(message);
                            setUploadingImage(false);
                        };
                        img.src = event.target?.result || '';
                    } catch (err) {
                        console.error('Error converting AVIF:', err);
                        const message = 'AVIF files are not supported. Please convert to JPG or PNG and try again.';
                        setErrorMessage(message);
                        toast.error(message);
                        setUploadingImage(false);
                    }
                };
                reader.onerror = () => {
                    const message = 'Failed to read image file.';
                    setErrorMessage(message);
                    toast.error(message);
                    setUploadingImage(false);
                };
                reader.readAsDataURL(selectedImage);
                return;
            }

            const response = await taxPreparerSettingsAPI.updateProfilePicture(fileToUpload);
            await handleUploadSuccess(response);
        } catch (err) {
            console.error('Error uploading profile picture:', err);
            const message = err.message || 'Failed to upload profile picture';
            setErrorMessage(message);
            toast.error(message);
        } finally {
            if (!isAvifFile) {
                setUploadingImage(false);
            }
        }
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
                syncHeaderProfile(result?.data?.profile_information || result?.data?.profile || null);
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

    const effectiveProfilePicture = imagePreview || currentProfileImage || null;
    const fullName = profileData?.name || `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim() || 'User';

    return (
        <div className="mobile-wrapper" style={{
            backgroundColor: "#F3F7FF",
            padding: "10px",
            borderRadius: "12px",
            border: "none"
        }}>
            {/* Personal Information Section */}
            <div className="flex flex-col gap-4 border border-[#E8F0FF] p-4 rounded-lg bg-white mb-4 mobile-section">

                <div className="align-items-center">
                    <h5
                        className="mb-0 me-3 mobile-title"
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
                        className="mb-0 mobile-subtitle"
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
                <div className="d-flex align-items-center mb-4 mt-6 mobile-profile-img-row">
                    {effectiveProfilePicture && effectiveProfilePicture !== 'null' && effectiveProfilePicture !== 'undefined' && !profileImageError ? (
                        <div className="me-3" style={{ position: 'relative' }}>
                            <img
                                src={effectiveProfilePicture}
                                alt={fullName}
                                className="mobile-profile-img"
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    objectFit: 'cover',
                                    borderRadius: '50%',
                                    border: '3px solid #e0e0e0',
                                    display: 'block'
                                }}
                                onError={() => {
                                    // Hide image on error, show initials placeholder instead
                                    setProfileImageError(true);
                                }}
                            />
                        </div>
                    ) : (
                        <div
                            className="me-3"
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                backgroundColor: '#e0e0e0',
                                border: '3px solid #ccc',
                                color: '#666',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <span style={{ fontSize: '32px' }}>👤</span>
                        </div>
                    )}
                    <div>
                        <div className="mb-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                id="taxProfileImageInput"
                                accept="image/*,.avif,.webp,.heic,.heif"
                                onChange={handleImageSelect}
                                style={{ display: 'none' }}
                            />
                            <label
                                htmlFor="taxProfileImageInput"
                                className="btn text-white btn-sm mb-2"
                                style={{
                                    background: "#F56D2D",
                                    fontSize: "15px",
                                    fontWeight: "400",
                                    fontFamily: "BasisGrotesquePro",
                                    cursor: 'pointer'
                                }}
                            >
                                {selectedImage ? `Selected: ${selectedImage.name}` : 'Choose Photo'}
                            </label>
                        </div>

                        {selectedImage && (
                            <div className="mb-2">
                                <button
                                    type="button"
                                    className="btn btn-success btn-sm me-2 mobile-btn"
                                    onClick={handleImageUpload}
                                    disabled={uploadingImage}
                                    style={{ fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                                >
                                    {uploadingImage ? (
                                        <>
                                            <div className="spinner-border spinner-border-sm me-1" role="status">
                                                <span className="visually-hidden">Uploading...</span>
                                            </div>
                                            Uploading...
                                        </>
                                    ) : (
                                        'Upload Photo'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm mobile-btn"
                                    onClick={() => {
                                        setSelectedImage(null);
                                        setImagePreview(null);
                                        setErrorMessage(null);
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                        }
                                    }}
                                    style={{ fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {errorMessage && (
                            <p className="text-danger small mb-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                                {errorMessage}
                            </p>
                        )}

                        <p className="text-muted small mb-0" style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
                            JPG, PNG, AVIF, WEBP, GIF up to 10MB
                        </p>
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
                                className="form-control w-full mobile-input"
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
                                className="form-control w-full mobile-input"
                                value={formData.email}
                                onChange={handleChange}
                                style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                            />
                        </div>
                        <div className="col-12">
                            <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                Phone Number
                            </label>
                            <PhoneInput
                                country={phoneCountry}
                                value={formData.phone_number || ''}
                                onChange={(phone) => {
                                    setFormData(prev => ({ ...prev, phone_number: phone }));
                                }}
                                onCountryChange={(countryCode) => {
                                    setPhoneCountry(countryCode.toLowerCase());
                                }}
                                inputClass="form-control w-full mobile-input"
                                containerClass="phone-input-container"
                                inputStyle={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                                enableSearch={true}
                                countryCodeEditable={false}
                            />
                        </div>
                        <div className="col-12">
                            <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                Availability
                            </label>
                            <select
                                name="availability"
                                className="form-control w-full mobile-input"
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

                    {/* Firm Information - Show only if user is not firm admin or super admin */}
                    {firmInfo && userRole && userRole !== 'firm' && userRole !== 'admin' && userRole !== 'super_admin' && (
                        <div className="mt-4 pt-4 border-top border-[#E8F0FF]">
                            <h6
                                className="mb-3"
                                style={{
                                    color: "#3B4A66",
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    fontFamily: "BasisGrotesquePro"
                                }}
                            >
                                Current Firm
                            </h6>
                            <div className="row g-3 mb-4">
                                <div className="col-md-6">
                                    <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                        Firm Name
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control w-full mobile-input"
                                        value={firmInfo.name || ''}
                                        disabled
                                        style={{
                                            color: "#6B7280",
                                            fontSize: "13px",
                                            fontWeight: "400",
                                            fontFamily: "BasisGrotesquePro",
                                            backgroundColor: "#F9FAFB",
                                            cursor: "not-allowed"
                                        }}
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                        Status
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control w-full mobile-input"
                                        value={firmInfo.status ? firmInfo.status.charAt(0).toUpperCase() + firmInfo.status.slice(1) : ''}
                                        disabled
                                        style={{
                                            color: "#6B7280",
                                            fontSize: "13px",
                                            fontWeight: "400",
                                            fontFamily: "BasisGrotesquePro",
                                            backgroundColor: "#F9FAFB",
                                            cursor: "not-allowed"
                                        }}
                                    />
                                </div>
                                {firmInfo.subdomain && (
                                    <div className="col-md-3">
                                        <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>
                                            Subdomain
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control w-full mobile-input"
                                            value={firmInfo.subdomain || ''}
                                            disabled
                                            style={{
                                                color: "#6B7280",
                                                fontSize: "13px",
                                                fontWeight: "400",
                                                fontFamily: "BasisGrotesquePro",
                                                backgroundColor: "#F9FAFB",
                                                cursor: "not-allowed"
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-1">
                        <button
                            type="submit"
                            className="btn d-flex align-items-center gap-2 mobile-btn"
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
