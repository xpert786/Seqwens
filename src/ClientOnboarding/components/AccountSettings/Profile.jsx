import React, { useState, useEffect } from "react";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { SaveIcon } from "../icons";
import { profileAPI } from "../../utils/apiUtils";
import { setUserData as persistUserData, getUserData, getStorage } from "../../utils/userUtils";
import { toast } from "react-toastify";

export default function Profile() {
    const [userData, setUserData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        profile_image: null
    });
    const [phoneCountry, setPhoneCountry] = useState('us');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [profileImageError, setProfileImageError] = useState(false);
    const [firmInfo, setFirmInfo] = useState(null);
    const [userRole, setUserRole] = useState(null);

    // Reset image error when profile image changes
    useEffect(() => {
        setProfileImageError(false);
    }, [userData.profile_image, imagePreview]);

    // Fetch user data on component mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // First, try to get user data from storage for immediate display
                const storedUserData = getUserData();
                if (storedUserData) {
                    console.log('Found stored user data:', storedUserData);
                    setUserData(storedUserData);
                }
                
                // Then fetch fresh data from API
                const response = await profileAPI.getUserAccount();
                console.log('User account data from API:', response);
                console.log('Response structure:', Object.keys(response));
                
                // Handle different possible response structures
                let userInfo = response;
                if (response.user) {
                    userInfo = response.user;
                } else if (response.data) {
                    userInfo = response.data;
                }
                
                console.log('Extracted user info:', userInfo);
                console.log('Profile image fields in API response:', {
                    profile_picture: userInfo.profile_picture,
                    profile_image: userInfo.profile_image,
                    profileImage: userInfo.profileImage,
                    avatar: userInfo.avatar,
                    profile_photo: userInfo.profile_photo
                });
                
                // Extract firm information and user role
                const firmData = userInfo.firm || response.firm || null;
                const primaryRole = userInfo.primary_role || userInfo.role || null;
                setFirmInfo(firmData);
                setUserRole(primaryRole);
                
                // Update state with fetched data from API (this takes precedence)
                const updatedUserData = {
                    first_name: userInfo.first_name || userInfo.firstName || '',
                    middle_name: userInfo.middle_name || userInfo.middleName || '',
                    last_name: userInfo.last_name || userInfo.lastName || '',
                    email: userInfo.email || '',
                    phone_number: userInfo.phone_number || userInfo.phoneNumber || userInfo.phone || '',
                    profile_image: userInfo.profile_picture || userInfo.profile_image || userInfo.profileImage || userInfo.avatar || userInfo.profile_photo || null
                };
                console.log('Updated user data from API:', updatedUserData);
                setUserData(updatedUserData);
                
                // Update storage with fresh API data
                persistUserData(updatedUserData);
            } catch (err) {
                console.error('Error fetching user data:', err);
                const errorMessage = err.message || 'Failed to fetch user data';
                setError(errorMessage);
                toast.error(errorMessage, {
                  position: "top-right",
                  autoClose: 3000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  icon: false,
                  className: "custom-toast-error",
                  bodyClassName: "custom-toast-body",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // Handle form input changes
    const handleInputChange = (field, value) => {
        console.log(`Input change - Field: ${field}, Value: ${value}`);
        setUserData(prev => {
            const newData = {
                ...prev,
                [field]: value
            };
            console.log('New user data after change:', newData);
            return newData;
        });
    };

    // Handle profile picture selection and preview
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate it's an image file (including .avif)
            const isValidImage = file.type.startsWith('image/') || 
                                 file.name.toLowerCase().endsWith('.avif') ||
                                 file.name.toLowerCase().endsWith('.webp') ||
                                 file.name.toLowerCase().endsWith('.heic') ||
                                 file.name.toLowerCase().endsWith('.heif');
            
            if (!isValidImage) {
                setError('Please select a valid image file (JPG, PNG, GIF, AVIF, WEBP, etc.)');
                return;
            }
            
            // Validate file size (10MB limit for images)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                setError(`Image size should be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
                return;
            }
            
            setSelectedImage(file);
            setError(null);
            
            // Create preview for images
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.onerror = () => {
                setError('Failed to load image preview');
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle successful profile picture upload
    const handleUploadSuccess = async (response) => {
        console.log('Profile picture upload response:', response);
            
            // Update userData with new profile image URL
            let newProfileImageUrl = null;
            
            // Try different possible response structures - prioritize profile_picture since that's what the API uses
            if (response.profile_picture) {
                newProfileImageUrl = response.profile_picture;
            } else if (response.profile_image) {
                newProfileImageUrl = response.profile_image;
            } else if (response.user && response.user.profile_picture) {
                newProfileImageUrl = response.user.profile_picture;
            } else if (response.user && response.user.profile_image) {
                newProfileImageUrl = response.user.profile_image;
            } else if (response.data && response.data.profile_picture) {
                newProfileImageUrl = response.data.profile_picture;
            } else if (response.data && response.data.profile_image) {
                newProfileImageUrl = response.data.profile_image;
            }
            
            if (newProfileImageUrl) {
                const updatedUserData = {
                    ...userData,
                    profile_image: newProfileImageUrl
                };
                setUserData(updatedUserData);
                // Persist to storage
                persistUserData(updatedUserData);
                console.log('Updated profile image URL:', newProfileImageUrl);
            } else {
                // If no URL in response, refetch user data to get updated profile
                console.log('No profile image URL in response, refetching user data...');
                const updatedUserData = await profileAPI.getUserAccount();
                console.log('Refetched user data:', updatedUserData);
                
                let userInfo = updatedUserData;
                if (updatedUserData.user) {
                    userInfo = updatedUserData.user;
                } else if (updatedUserData.data) {
                    userInfo = updatedUserData.data;
                }
                
                const finalUserData = {
                    ...userData,
                    profile_image: userInfo.profile_picture || userInfo.profile_image || userInfo.profileImage || userInfo.avatar || userData.profile_image
                };
                setUserData(finalUserData);
                // Persist to storage
                persistUserData(finalUserData);
            }
            
            // Clear selected image and preview
            setSelectedImage(null);
            setImagePreview(null);
            
            // Refresh navbar and topbar profile pictures
            if (window.refreshNavbarProfilePicture) {
                console.log('🔄 Refreshing navbar profile picture...');
                window.refreshNavbarProfilePicture();
            }
            if (window.refreshClientTopbarAvatar) {
                console.log('🔄 Refreshing topbar profile picture...');
                window.refreshClientTopbarAvatar();
            }
            
        setUploadingImage(false);
        toast.success('Profile picture updated successfully!', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            icon: false,
            className: "custom-toast-success",
            bodyClassName: "custom-toast-body",
        });
    };
    
    // Handle profile picture upload
    const handleImageUpload = async () => {
        if (!selectedImage) {
            setError('Please select an image first');
            return;
        }
        
        try {
            setUploadingImage(true);
            setError(null);
            
            // Log file details before upload
            console.log('Uploading file details:', {
                name: selectedImage.name,
                type: selectedImage.type,
                size: selectedImage.size,
                lastModified: selectedImage.lastModified
            });
            
            // Check if the file type is AVIF
            const isAVIF = selectedImage.name.toLowerCase().endsWith('.avif') || 
                          selectedImage.type === 'image/avif' || 
                          selectedImage.type === 'image/avif-sequence';
            
            let fileToUpload = selectedImage;
            
            // If the file is .avif, provide helpful error message
            if (isAVIF) {
                console.log('AVIF file detected. Backend may not support AVIF format.');
                
                // Try to convert to a format that backend will accept
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        // Create an image element to convert AVIF to canvas
                        const img = new Image();
                        img.onload = async function() {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            
                            // Convert canvas to blob as PNG
                            canvas.toBlob(async (blob) => {
                                if (!blob) {
                                    setError('Failed to convert AVIF image. Please upload a JPG or PNG file instead.');
                                    toast.error('❌ Failed to convert AVIF image. Please upload a JPG or PNG file instead.', {
                                        position: "top-right",
                                        autoClose: 4000,
                                        hideProgressBar: false,
                                        closeOnClick: true,
                                        pauseOnHover: true,
                                        draggable: true,
                                    });
                                    setUploadingImage(false);
                                    return;
                                }
                                
                                // Convert blob to File
                                const convertedFile = new File([blob], selectedImage.name.replace(/\.avif$/i, '.png'), {
                                    type: 'image/png',
                                    lastModified: Date.now()
                                });
                                
                                console.log('Converted AVIF to PNG:', {
                                    name: convertedFile.name,
                                    type: convertedFile.type,
                                    size: convertedFile.size
                                });
                                
                                try {
                                    const response = await profileAPI.updateProfilePicture(convertedFile);
                                    handleUploadSuccess(response);
                                } catch (err) {
                                    console.error('Error uploading converted image:', err);
                                    setError(err.message || 'Failed to upload profile picture');
                                    toast.error(`❌ ${err.message || 'Failed to upload profile picture'}`, {
                                        position: "top-right",
                                        autoClose: 4000,
                                        hideProgressBar: false,
                                        closeOnClick: true,
                                        pauseOnHover: true,
                                        draggable: true,
                                    });
                                    setUploadingImage(false);
                                }
                            }, 'image/png', 0.9);
                        };
                        img.src = e.target.result;
                    } catch (err) {
                        console.error('Error converting AVIF:', err);
                        setError('AVIF files are not supported. Please convert to JPG or PNG and try again.');
                        toast.error('❌ AVIF files are not supported. Please convert to JPG or PNG and try again.', {
                            position: "top-right",
                            autoClose: 4000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                        });
                        setUploadingImage(false);
                    }
                };
                reader.readAsDataURL(selectedImage);
                return; // Exit early, async conversion will handle the upload
            }
            
            const response = await profileAPI.updateProfilePicture(fileToUpload);
            await handleUploadSuccess(response);
        } catch (err) {
            console.error('Error uploading profile picture:', err);
            setError(err.message || 'Failed to upload profile picture');
            toast.error(`❌ ${err.message || 'Failed to upload profile picture'}`, {
                position: "top-right",
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } finally {
            setUploadingImage(false);
        }
    };

    // Handle form submission
    const handleSaveChanges = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);
            
            // Prepare data for API (exclude profile_image for now)
            const { profile_image, ...dataToSave } = userData;
            const response = await profileAPI.updateUserAccount(dataToSave);
            
            // Update local state with any changes from the API response
            if (response) {
                let updatedData = response;
                if (response.user) {
                    updatedData = response.user;
                } else if (response.data) {
                    updatedData = response.data;
                }
                
                const finalUserData = {
                    ...userData,
                    first_name: updatedData.first_name || userData.first_name,
                    middle_name: updatedData.middle_name || userData.middle_name,
                    last_name: updatedData.last_name || userData.last_name,
                    email: updatedData.email || userData.email,
                    phone_number: updatedData.phone_number || userData.phone_number,
                };
                
                setUserData(finalUserData);
                // Persist to storage
                persistUserData(finalUserData);
            }
            
            toast.success('Profile updated successfully!', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                icon: false,
                className: "custom-toast-success",
                bodyClassName: "custom-toast-body",
            });
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.message || 'Failed to update profile');
            toast.error(`❌ ${err.message || 'Failed to update profile'}`, {
                position: "top-right",
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } finally {
            setSaving(false);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3" style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
                        Loading profile data...
                    </p>
                </div>
            </div>
        );
    }
    return (
        <div className="container-fluid px-0 pb-5">
    {/* Header */}
    <div className="mb-4 px-1">
        <h5
            style={{
                color: "#3B4A66",
                fontSize: "22px",
                fontWeight: "600",
                fontFamily: "BasisGrotesquePro",
            }}
        >
            Personal Information
        </h5>
        <p
            className="mb-0 text-muted"
            style={{
                fontSize: "15px",
                fontFamily: "BasisGrotesquePro",
            }}
        >
            Update your personal details and tax information
        </p>
    </div>

    {/* Profile Image Section */}
    <div className="d-flex flex-column flex-sm-row align-items-center align-items-sm-start gap-4 mb-5 mt-4 px-1">
        {(imagePreview || (userData.profile_image && userData.profile_image !== 'null' && userData.profile_image !== 'undefined')) && !profileImageError ? (
            <div style={{ position: 'relative' }}>
                <img
                    src={imagePreview || userData.profile_image}
                    alt="Profile"
                    style={{ 
                        width: '110px',
                        height: '110px',
                        objectFit: 'cover',
                        borderRadius: '50%',
                        border: '4px solid #fff',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                        display: 'block'
                    }}
                    onError={() => setProfileImageError(true)}
                />
            </div>
        ) : (
            <div 
                style={{
                    width: '110px',
                    height: '110px',
                    borderRadius: '50%',
                    backgroundColor: '#F3F4F6',
                    border: '2px dashed #D1D5DB',
                    color: '#9CA3AF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px'
                }}
            >
                👤
            </div>
        )}

        <div className="text-center text-sm-start flex-grow-1">
            <div className="d-flex flex-wrap justify-content-center justify-content-sm-start gap-2 mb-2">
                <input
                    type="file"
                    id="profileImageInput"
                    accept="image/*,.avif,.webp,.heic,.heif"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                />
                <label 
                    htmlFor="profileImageInput" 
                    className="btn text-white px-4" 
                    style={{ 
                        background: "#F56D2D", 
                        fontSize: "14px", 
                        fontWeight: "500", 
                        borderRadius: "10px",
                        cursor: 'pointer',
                        padding: "10px 20px"
                    }}
                >
                    {selectedImage ? 'Change Photo' : 'Choose Photo'}
                </label>

                {selectedImage && (
                    <>
                        <button 
                            className="btn btn-success px-4"
                            onClick={handleImageUpload}
                            disabled={uploadingImage}
                            style={{ borderRadius: "10px", fontSize: "14px" }}
                        >
                            {uploadingImage ? 'Uploading...' : 'Upload'}
                        </button>
                        <button 
                            className="btn btn-outline-secondary px-4"
                            onClick={() => {
                                setSelectedImage(null);
                                setImagePreview(null);
                            }}
                            style={{ borderRadius: "10px", fontSize: "14px" }}
                        >
                            Cancel
                        </button>
                    </>
                )}
            </div>
            
            <p className="text-muted small mb-0 mt-2">
                {selectedImage ? <strong>Selected: {selectedImage.name}</strong> : 'JPG, PNG, AVIF or WEBP. Max 10MB'}
            </p>
        </div>
    </div>

    {/* Form */}
    <form onSubmit={handleSaveChanges} className="px-1">
        <div className="row g-3">
            <div className="col-12 col-md-4">
                <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "600" }}>First Name</label>
                <input 
                    type="text" 
                    className="form-control py-2" 
                    value={userData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    style={{ borderRadius: "10px", border: "1px solid #E5E7EB" }}
                />
            </div>
            <div className="col-12 col-md-4">
                <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "600" }}>Middle Initial</label>
                <input 
                    type="text" 
                    className="form-control py-2" 
                    value={userData.middle_name}
                    onChange={(e) => handleInputChange('middle_name', e.target.value)}
                    style={{ borderRadius: "10px", border: "1px solid #E5E7EB" }}
                />
            </div>
            <div className="col-12 col-md-4">
                <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "600" }}>Last Name</label>
                <input 
                    type="text" 
                    className="form-control py-2" 
                    value={userData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    style={{ borderRadius: "10px", border: "1px solid #E5E7EB" }}
                />
            </div>
            <div className="col-12 col-md-6">
                <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "600" }}>Email</label>
                <input
                    type="email"
                    className="form-control py-2"
                    value={userData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    style={{ borderRadius: "10px", border: "1px solid #E5E7EB" }}
                />
            </div>
            <div className="col-12 col-md-6">
                <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "600" }}>Phone</label>
                <PhoneInput
                    country={phoneCountry}
                    value={userData.phone_number || ''}
                    onChange={(phone) => handleInputChange('phone_number', phone)}
                    onCountryChange={(countryCode) => setPhoneCountry(countryCode.toLowerCase())}
                    inputClass="form-control w-100"
                    containerClass="w-100 phone-input-container"
                    inputStyle={{ width: "100%", borderRadius: "10px", height: "42px" }}
                    enableSearch={true}
                    countryCodeEditable={false}
                />
            </div>
        </div>

        {/* Firm Information */}
        {firmInfo && userRole && !['firm', 'admin', 'super_admin'].includes(userRole) && (
            <div className="mt-5 pt-4 border-top" style={{ borderColor: "#F3F4F6 !important" }}>
                <h6 className="mb-4" style={{ color: "#3B4A66", fontWeight: "700" }}>Current Firm</h6>
                <div className="row g-3">
                    <div className="col-12 col-md-6">
                        <label className="form-label text-muted small fw-bold">Firm Name</label>
                        <input 
                            type="text" 
                            className="form-control bg-light border-0" 
                            value={firmInfo.name || ''} 
                            disabled 
                            style={{ borderRadius: "10px", padding: "12px" }}
                        />
                    </div>
                    <div className="col-6 col-md-3">
                        <label className="form-label text-muted small fw-bold">Status</label>
                        <input 
                            type="text" 
                            className="form-control bg-light border-0" 
                            value={firmInfo.status ? firmInfo.status.toUpperCase() : ''} 
                            disabled 
                            style={{ borderRadius: "10px", padding: "12px" }}
                        />
                    </div>
                    {firmInfo.subdomain && (
                        <div className="col-6 col-md-3">
                            <label className="form-label text-muted small fw-bold">Subdomain</label>
                            <input 
                                type="text" 
                                className="form-control bg-light border-0" 
                                value={firmInfo.subdomain || ''} 
                                disabled 
                                style={{ borderRadius: "10px", padding: "12px" }}
                            />
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Submit Button */}
        <div className="mt-5 pb-5 mb-5">
            <button
                type="submit"
                className="btn w-100 w-md-auto d-flex align-items-center justify-content-center gap-2 py-3 px-md-5"
                disabled={saving}
                style={{ 
                    backgroundColor: "#F56D2D", 
                    color: "#ffffff", 
                    fontSize: "16px", 
                    fontWeight: "600", 
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(245, 109, 45, 0.2)",
                    opacity: saving ? 0.7 : 1 
                }}
            >
                {saving ? (
                    <div className="spinner-border spinner-border-sm" role="status" />
                ) : (
                    <><SaveIcon /> Save Changes</>
                )}
            </button>
        </div>
    </form>
</div>
    );
}
