import React, { useState, useEffect } from "react";
import { SaveIcon } from "../icons";
import { profileAPI } from "../../utils/apiUtils";
import { setUserData as persistUserData, getUserData, getStorage } from "../../utils/userUtils";

export default function Profile() {
    const [userData, setUserData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        profile_image: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

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
                setError(err.message || 'Failed to fetch user data');
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
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file');
                return;
            }
            
            // Validate file size (2MB limit)
            if (file.size > 2 * 1024 * 1024) {
                setError('Image size should be less than 2MB');
                return;
            }
            
            setSelectedImage(file);
            setError(null);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
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
            
            const response = await profileAPI.updateProfilePicture(selectedImage);
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
            if (window.refreshTopbarProfilePicture) {
                console.log('🔄 Refreshing topbar profile picture...');
                window.refreshTopbarProfilePicture();
            }
            
            alert('Profile picture updated successfully!');
        } catch (err) {
            console.error('Error uploading profile picture:', err);
            setError(err.message || 'Failed to upload profile picture');
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
            
            alert('Profile updated successfully!');
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.message || 'Failed to update profile');
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

            {/* Error Message */}
            {error && (
                <div className="alert alert-danger mb-4" role="alert">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Profile Image */}
            <div className="d-flex align-items-center mb-4 mt-6">
                <img
                    src={imagePreview || userData.profile_image || "https://i.pravatar.cc/120"}
                    alt="Profile"
                    className="rounded-circle me-3"
                    width="99.96px"
                    height="98px"
                    style={{ objectFit: 'cover' }}
                    onError={(e) => {
                        console.error('Failed to load profile image:', e.target.src);
                        // Fallback to default avatar if image fails to load
                        if (e.target.src !== "https://i.pravatar.cc/120") {
                            e.target.src = "https://i.pravatar.cc/120";
                        }
                    }}
                />
                <div>
                    <div className="mb-2">
                        <input
                            type="file"
                            id="profileImageInput"
                            accept="image/*"
                            onChange={handleImageSelect}
                            style={{ display: 'none' }}
                        />
                        <label 
                            htmlFor="profileImageInput" 
                            className="btn text-white btn-sm mb-2" 
                            style={{ 
                                background: "#F56D2D", 
                                fontSize: "15px", 
                                fontWeight: "400", 
                                fontFamily: "BasisGrotesquePro",
                                cursor: 'pointer'
                            }}
                        >
                            {selectedImage ? 'Selected: ' + selectedImage.name : 'Choose Photo'}
                        </label>
                    </div>
                    
                    {selectedImage && (
                        <div className="mb-2">
                            <button 
                                className="btn btn-success btn-sm me-2"
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
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                    setSelectedImage(null);
                                    setImagePreview(null);
                                }}
                                style={{ fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                    
                    <p className="text-muted small mb-0" style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
                        JPG, PNG up to 2MB
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveChanges}>
                <div className="row g-3">
                    <div className="col-md-4">
                        <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>First Name</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            value={userData.first_name}
                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                            style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                            
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Middle Initial</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            value={userData.middle_name}
                            onChange={(e) => handleInputChange('middle_name', e.target.value)}
                            style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Last Name</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            value={userData.last_name}
                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                            style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Email</label>
                        <input
                            type="email"
                            className="form-control"
                            value={userData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Phone</label>
                        <input
                            type="text"
                            className="form-control"
                            value={userData.phone_number}
                            onChange={(e) => handleInputChange('phone_number', e.target.value)}
                            style={{ color: "#3B4A66", fontSize: "13px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <button
                        type="submit"
                        className="btn d-flex align-items-center gap-2"
                        disabled={saving}
                        style={{ backgroundColor: "#F56D2D", color: "#ffffff", fontSize: "15px", fontWeight: "400", fontFamily: "BasisGrotesquePro", opacity: saving ? 0.7 : 1 }}
                    >
                        {saving ? (
                            <>
                                <div className="spinner-border spinner-border-sm" role="status">
                                    <span className="visually-hidden">Saving...</span>
                                </div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <SaveIcon />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
