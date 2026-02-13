
import React, { useState, useEffect } from "react";
import { userAPI, handleAPIError } from "../ClientOnboarding/utils/apiUtils";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function ForcedPasswordChangeModal() {
    const [show, setShow] = useState(false);
    const [user, setUser] = useState(null);

    // Form State
    const [pwCurrent, setPwCurrent] = useState("");
    const [pwNew, setPwNew] = useState("");
    const [pwConfirm, setPwConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Visibility states for each field
    const [showPwCurrent, setShowPwCurrent] = useState(false);
    const [showPwNew, setShowPwNew] = useState(false);
    const [showPwConfirm, setShowPwConfirm] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const checkRequirement = () => {
            const localData = localStorage.getItem("userData");
            const sessionData = sessionStorage.getItem("userData");
            const storedUserData = localData || sessionData;

            console.log("ForcedPasswordChangeModal: Checking requirement...", { hasData: !!storedUserData });

            if (storedUserData) {
                try {
                    const parsedUser = JSON.parse(storedUserData);
                    console.log("ForcedPasswordChangeModal: User data:", parsedUser);
                    if (parsedUser.requires_password_change) {
                        setUser(parsedUser);
                        setShow(true);
                        console.log("ForcedPasswordChangeModal: Showing modal");
                    } else {
                        setShow(false);
                    }
                } catch (e) {
                    console.error("ForcedPasswordChangeModal: Error parsing user data", e);
                }
            }
        };

        checkRequirement();

        // Optional: Listen for storage events (if logged in from another tab? unlikely needed but good practice)
        window.addEventListener('storage', checkRequirement);
        return () => window.removeEventListener('storage', checkRequirement);
    }, []);

    if (!show) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (pwNew !== pwConfirm) {
            setError("New passwords do not match");
            return;
        }
        if (pwNew.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);

        try {
            await userAPI.changePassword(pwCurrent, pwNew, pwConfirm);

            toast.success("Password changed successfully", {
                position: "top-right",
                autoClose: 3000,
            });

            // Update local and session storage to remove the flag
            const localData = localStorage.getItem("userData");
            const sessionData = sessionStorage.getItem("userData");

            if (localData) {
                try {
                    const userData = JSON.parse(localData);
                    userData.requires_password_change = false;
                    localStorage.setItem("userData", JSON.stringify(userData));
                    console.log("ForcedPasswordChangeModal: Updated localStorage");
                } catch (e) {
                    console.error("ForcedPasswordChangeModal: Error updating localStorage", e);
                }
            }
            if (sessionData) {
                try {
                    const userData = JSON.parse(sessionData);
                    userData.requires_password_change = false;
                    sessionStorage.setItem("userData", JSON.stringify(userData));
                    console.log("ForcedPasswordChangeModal: Updated sessionStorage");
                } catch (e) {
                    console.error("ForcedPasswordChangeModal: Error updating sessionStorage", e);
                }
            }

            setShow(false);

            // Clear form
            setPwCurrent("");
            setPwNew("");
            setPwConfirm("");

        } catch (err) {
            console.error(err);

            // Try to get specific validation error first
            const fieldErrors = err.response?.data?.errors;
            if (fieldErrors) {
                // Get the first error message from the errors object
                const firstError = Object.values(fieldErrors).flat()[0];
                if (firstError) {
                    setError(firstError);
                    return;
                }
            }

            // Fallback to generic message or apiRequest's formatted message
            const msg = handleAPIError(err) || err.message || "Failed to update password";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="fixed inset-0 flex items-center justify-center"
            style={{
                backgroundColor: 'rgba(0,0,0,0.85)',
                zIndex: 99999, // Ensure it's on top of everything including other modals
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            }}>
            <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4 shadow-xl relative animate-forcedPwFadeIn"
                style={{ maxHeight: '90vh', overflowY: 'auto' }}>

                <div className="mb-6 text-center">
                    <h3 className="text-[#3B4A66] text-xl font-semibold mb-2" style={{ fontFamily: 'BasisGrotesquePro, sans-serif' }}>
                        Change Password Required
                    </h3>
                    <p className="text-gray-600 text-sm">
                        You are using a temporary password. Please set a new secure password to continue accessing the dashboard.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded flex items-center">
                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-[#3B4A66] text-sm font-medium mb-1" style={{ fontFamily: 'BasisGrotesquePro, sans-serif' }}>
                            Current (Temporary) Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPwCurrent ? "text" : "password"}
                                value={pwCurrent}
                                onChange={(e) => setPwCurrent(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="Enter current password"
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowPwCurrent(!showPwCurrent)}
                            >
                                {showPwCurrent ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-[#3B4A66] text-sm font-medium mb-1" style={{ fontFamily: 'BasisGrotesquePro, sans-serif' }}>
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPwNew ? "text" : "password"}
                                value={pwNew}
                                onChange={(e) => setPwNew(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="At least 8 characters"
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowPwNew(!showPwNew)}
                            >
                                {showPwNew ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-[#3B4A66] text-sm font-medium mb-1" style={{ fontFamily: 'BasisGrotesquePro, sans-serif' }}>
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPwConfirm ? "text" : "password"}
                                value={pwConfirm}
                                onChange={(e) => setPwConfirm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="Confirm new password"
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowPwConfirm(!showPwConfirm)}
                            >
                                {showPwConfirm ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        style={{ fontFamily: 'BasisGrotesquePro, sans-serif', borderRadius: "10px" }}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Updating Password...
                            </div>
                        ) : "Update Password"}
                    </button>

                    <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                localStorage.removeItem('userData');
                                localStorage.removeItem('isLoggedIn');
                                localStorage.removeItem('access_token');
                                localStorage.removeItem('refresh_token');
                                sessionStorage.clear();
                                navigate('/login');
                            }}
                            className="text-gray-500 text-sm hover:text-gray-700 hover:underline transition-colors"
                        >
                            Or log out and try again
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                @keyframes forcedPwFadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-forcedPwFadeIn {
                    animation: forcedPwFadeIn 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
