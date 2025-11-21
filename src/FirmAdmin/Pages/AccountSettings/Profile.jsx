import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { firmAdminDashboardAPI, handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";

export default function Profile() {
    const [userData, setUserData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        profile_picture: null
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [profilePictureFile, setProfilePictureFile] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await firmAdminDashboardAPI.getAccountSettings();
                
                // Handle response - it might be wrapped in a 'data' property
                const data = response?.data || response;
                
                setUserData({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    email: data.email || '',
                    phone_number: data.phone_number || '',
                    profile_picture: data.profile_picture || null
                });

                // Set image preview if profile picture URL exists
                if (data.profile_picture) {
                    setImagePreview(data.profile_picture);
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                const errorMessage = handleAPIError(err);
                setError(errorMessage);
                toast.error(errorMessage, {
                    position: "top-right",
                    autoClose: 3000,
                });
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const handleInputChange = (field, value) => {
        setUserData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file', {
                    position: "top-right",
                    autoClose: 3000,
                });
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB', {
                    position: "top-right",
                    autoClose: 3000,
                });
                return;
            }

            setProfilePictureFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const updateData = {
                first_name: userData.first_name,
                last_name: userData.last_name,
                email: userData.email,
                phone_number: userData.phone_number,
            };

            // Add profile picture file if a new one was selected
            if (profilePictureFile) {
                updateData.profile_picture = profilePictureFile;
            }

            const response = await firmAdminDashboardAPI.updateAccountSettings(updateData);
            
            // Update local state with response data if available
            const data = response?.data || response;
            if (data) {
                setUserData(prev => ({
                    ...prev,
                    first_name: data.first_name || prev.first_name,
                    last_name: data.last_name || prev.last_name,
                    email: data.email || prev.email,
                    phone_number: data.phone_number || prev.phone_number,
                    profile_picture: data.profile_picture || prev.profile_picture
                }));

                // Update image preview if new profile picture URL is returned
                if (data.profile_picture) {
                    setImagePreview(data.profile_picture);
                }
            }

            // Clear the file input
            setProfilePictureFile(null);

            toast.success("Profile updated successfully!", {
                position: "top-right",
                autoClose: 3000,
            });
        } catch (err) {
            const errorMessage = handleAPIError(err);
            setError(errorMessage);
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <p className="text-center text-gray-500">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                        Profile Information
                    </h3>
                    <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                        Update your personal information and profile picture
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Profile Picture */}
                    <div>
                        <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                            Profile Picture
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                                ) : userData.profile_picture ? (
                                    <img src={userData.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                    id="profile-image-upload"
                                />
                                <label
                                    htmlFor="profile-image-upload"
                                    className="px-4 py-2 bg-[#3AD6F2] text-white rounded-lg cursor-pointer hover:bg-[#2BC5E0] transition font-[BasisGrotesquePro] text-sm"
                                >
                                    Upload Photo
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                                First Name
                            </label>
                            <input
                                type="text"
                                value={userData.first_name}
                                onChange={(e) => handleInputChange('first_name', e.target.value)}
                                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                                placeholder="Enter first name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                                Last Name
                            </label>
                            <input
                                type="text"
                                value={userData.last_name}
                                onChange={(e) => handleInputChange('last_name', e.target.value)}
                                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                                placeholder="Enter last name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={userData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                                placeholder="Enter email"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={userData.phone_number}
                                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                                placeholder="Enter phone number"
                            />
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t border-[#E5E7EB]">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                borderRadius: '8px'
                            }}
                            className="px-6 py-2 bg-[#3AD6F2] text-white hover:bg-[#2BC5E0] transition font-[BasisGrotesquePro] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

