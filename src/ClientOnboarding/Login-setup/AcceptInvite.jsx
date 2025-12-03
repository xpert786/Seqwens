import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import "../styles/AcceptInvite.css";
import FixedLayout from "../components/FixedLayout";
import { invitationAPI, handleAPIError, validatePassword } from "../utils/apiUtils";
import { setTokens } from "../utils/userUtils";
import { toast } from "react-toastify";

export default function AcceptInvite() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [invitationData, setInvitationData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isDenying, setIsDenying] = useState(false);
    const [errors, setErrors] = useState({});
    const [isAccepted, setIsAccepted] = useState(false);
    const [isDenied, setIsDenied] = useState(false);

    // Form fields
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [phoneCountry, setPhoneCountry] = useState('us');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    // Fetch invitation details on component mount
    useEffect(() => {
        const validateInvitation = async () => {
            // Debug: Log the token
            console.log('Token from URL:', token);
            console.log('Full URL:', window.location.href);

            if (!token) {
                setErrors({ general: "Invalid invitation link. No token provided." });
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setErrors({});
                console.log('Validating invitation with token:', token);
                const response = await invitationAPI.validateInvitation(token);
                console.log('Validation response:', response);

                if (response.success && response.is_valid && response.data) {
                    setInvitationData(response.data);
                } else {
                    // Handle error cases
                    const errorMessage = response.message || "Invalid invitation token.";
                    const tokenErrors = response.errors?.token || [];

                    if (response.data) {
                        // Expired or already accepted - show data but with error
                        setInvitationData(response.data);
                        setErrors({
                            general: tokenErrors[0] || errorMessage,
                            token: tokenErrors
                        });
                    } else {
                        // Invalid token
                        setErrors({
                            general: tokenErrors[0] || errorMessage,
                            token: tokenErrors
                        });
                    }
                }
            } catch (error) {
                console.error('Error validating invitation:', error);
                const errorMessage = handleAPIError(error);
                setErrors({ general: errorMessage });
            } finally {
                setIsLoading(false);
            }
        };

        validateInvitation();
    }, [token]);

    const handleAcceptInvitation = async (e) => {
        e?.preventDefault();

        if (!token) {
            setErrors({ general: "Invalid invitation token." });
            return;
        }

        // Clear previous errors
        const newErrors = {};

        // Validate password
        if (!password) {
            newErrors.password = "Password is required.";
        } else {
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.isValid) {
                const requirements = [];
                if (!passwordValidation.minLength) requirements.push("at least 8 characters");
                if (!passwordValidation.hasNumber) requirements.push("a number");
                if (!passwordValidation.hasUpperLower) requirements.push("uppercase and lowercase letters");
                if (!passwordValidation.hasSpecialChar) requirements.push("a special character");
                newErrors.password = `Password must contain ${requirements.join(", ")}.`;
            }
        }

        // Validate password confirmation
        if (!passwordConfirm) {
            newErrors.passwordConfirm = "Please confirm your password.";
        } else if (password !== passwordConfirm) {
            newErrors.passwordConfirm = "Passwords do not match.";
        }

        // Validate phone number format if provided
        if (phoneNumber && !phoneNumber.startsWith("+")) {
            newErrors.phoneNumber = "Phone number must start with '+' and include country code (e.g., +1234567890).";
        }

        // If there are validation errors, set them and return
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsAccepting(true);
        setErrors({});

        try {
            const response = await invitationAPI.acceptInvitation(
                token,
                password,
                passwordConfirm,
                phoneNumber || null
            );

            if (response.success && response.data) {
                setIsAccepted(true);

                // Store tokens if provided
                if (response.data.tokens) {
                    setTokens(
                        response.data.tokens.access,
                        response.data.tokens.refresh,
                        true
                    );
                }

                // Store user data if provided
                if (response.data.user) {
                    const user = response.data.user;
                    localStorage.setItem("isLoggedIn", "true");
                    localStorage.setItem("userData", JSON.stringify(user));

                    const roles = user.role; // Array of roles from API response
                    
                    // Check if user has multiple roles
                    if (roles && Array.isArray(roles) && roles.length > 1) {
                        // User has multiple roles, show role selection screen
                        toast.success(response.message || "Account created successfully! Welcome to the team!", {
                            position: "top-right",
                            autoClose: 3000,
                        });
                        setTimeout(() => {
                            navigate("/select-role", { 
                                state: { userData: user },
                                replace: true 
                            });
                        }, 2000);
                        return;
                    }

                    // Single role - proceed with normal navigation
                    // Map role to user_type for routing
                    // The API returns 'role' but the app uses 'user_type' for routing
                    let userType = user.user_type || (Array.isArray(roles) && roles.length > 0 ? roles[0] : null);

                    // Map 'staff' role to 'tax_preparer' for routing (staff use tax preparer dashboard)
                    if (userType === 'staff') {
                        userType = 'tax_preparer';
                    }

                    localStorage.setItem("userType", userType);

                    toast.success(response.message || "Account created successfully! Welcome to the team!", {
                        position: "top-right",
                        autoClose: 3000,
                    });

                    // Redirect based on user type/role
                    let redirectPath = "/login"; // Default fallback

                    if (userType === 'super_admin') {
                        redirectPath = "/superadmin";
                    } else if (userType === 'support_admin' || userType === 'billing_admin') {
                        redirectPath = "/superadmin";
                    } else if (userType === 'admin') {
                        redirectPath = "/firmadmin";
                    } else if (userType === 'tax_preparer') {
                        redirectPath = "/taxdashboard";
                    } else if (userType === 'client' || !userType) {
                        // Client routing - check verification status
                        const isEmailVerified = user.is_email_verified;
                        const isPhoneVerified = user.is_phone_verified;
                        const isCompleted = user.is_completed;

                        if (!isEmailVerified && !isPhoneVerified) {
                            redirectPath = "/two-auth";
                        } else if (isCompleted) {
                            // User is completed, go to main dashboard
                            redirectPath = "/dashboard";
                        } else {
                            // User is not completed, stay on dashboard-first page
                            redirectPath = "/dashboard-first";
                        }
                    }

                    // Redirect after a short delay
                    setTimeout(() => {
                        navigate(redirectPath);
                    }, 2000);
                } else {
                    // No user data, just redirect to login
                    toast.success(response.message || "Account created successfully! Welcome to the team!", {
                        position: "top-right",
                        autoClose: 3000,
                    });
                    setTimeout(() => {
                        navigate("/login");
                    }, 2000);
                }
            } else {
                setErrors({ general: response.message || "Failed to accept invitation." });
            }
        } catch (error) {
            console.error('Error accepting invitation:', error);

            // Handle API error response
            const fieldErrors = {};
            let errorMessage = error.message || handleAPIError(error);

            // Parse error message to extract field-specific errors
            // Error format from publicApiRequest: "Validation failed. password: error1, error2; phone_number: error3"
            if (errorMessage.includes(':')) {
                // Try to extract field errors from the message
                const parts = errorMessage.split(';');
                let generalMessage = '';

                parts.forEach(part => {
                    const trimmed = part.trim();
                    if (trimmed.includes(':')) {
                        const [field, ...errorParts] = trimmed.split(':');
                        const fieldName = field.trim();
                        const errorText = errorParts.join(':').trim();

                        // Map API field names to form field names
                        if (fieldName === 'password') {
                            if (errorText.toLowerCase().includes('match')) {
                                fieldErrors.passwordConfirm = errorText;
                            } else {
                                fieldErrors.password = errorText;
                            }
                        } else if (fieldName === 'password_confirm') {
                            fieldErrors.passwordConfirm = errorText;
                        } else if (fieldName === 'phone_number') {
                            fieldErrors.phoneNumber = errorText;
                        } else if (fieldName === 'token') {
                            fieldErrors.general = errorText;
                        } else {
                            // Keep as general error if field not recognized
                            if (!generalMessage) {
                                generalMessage = errorText;
                            }
                        }
                    } else if (trimmed && !trimmed.includes(':')) {
                        // This might be the main error message
                        if (!generalMessage && !trimmed.toLowerCase().includes('validation failed')) {
                            generalMessage = trimmed;
                        }
                    }
                });

                // If we have field errors but no general message, use the original message
                if (Object.keys(fieldErrors).length === 0) {
                    fieldErrors.general = errorMessage;
                } else if (generalMessage && !fieldErrors.general) {
                    fieldErrors.general = generalMessage;
                }
            } else {
                // Simple error message without field structure
                // Try to detect field from message content
                const errorLower = errorMessage.toLowerCase();
                if (errorLower.includes('password') && errorLower.includes('match')) {
                    fieldErrors.passwordConfirm = errorMessage;
                } else if (errorLower.includes('password')) {
                    fieldErrors.password = errorMessage;
                } else if (errorLower.includes('phone')) {
                    fieldErrors.phoneNumber = errorMessage;
                } else if (errorLower.includes('token')) {
                    fieldErrors.general = errorMessage;
                } else {
                    fieldErrors.general = errorMessage;
                }
            }

            setErrors(fieldErrors);
        } finally {
            setIsAccepting(false);
        }
    };

    const handleDenyInvitation = async () => {
        if (!token) {
            setErrors({ general: "Invalid invitation token." });
            return;
        }

        setIsDenying(true);
        setErrors({});

        try {
            const inviteType = invitationData?.invite_type || 'client';
            const response = await invitationAPI.declineInvitation(token, inviteType);

            if (response.success) {
                setIsDenied(true);
                toast.success(response.message || "Invitation declined successfully.", {
                    position: "top-right",
                    autoClose: 3000,
                });

                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } else {
                setErrors({ general: response.message || "Failed to decline invitation." });
            }
        } catch (error) {
            console.error('Error declining invitation:', error);
            setErrors({ general: handleAPIError(error) });
        } finally {
            setIsDenying(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });
        } catch (error) {
            return dateString;
        }
    };

    if (isLoading) {
        return (
            <FixedLayout>
                <div className="accept-invite-page">
                    <div className="accept-invite-card">
                        <div className="accept-invite-header">
                            <h5 className="accept-invite-title">Loading Invitation...</h5>
                            <p className="accept-invite-subtitle">Please wait while we fetch your invitation details.</p>
                        </div>
                    </div>
                </div>
            </FixedLayout>
        );
    }

    if (isAccepted) {
        return (
            <FixedLayout>
                <div className="accept-invite-page">
                    <div className="accept-invite-card">
                        <div className="accept-invite-header">
                            <h5 className="accept-invite-title">Invitation Accepted!</h5>
                            <p className="accept-invite-subtitle">Redirecting you to login page...</p>
                        </div>
                    </div>
                </div>
            </FixedLayout>
        );
    }

    if (isDenied) {
        return (
            <FixedLayout>
                <div className="accept-invite-page">
                    <div className="accept-invite-card">
                        <div className="accept-invite-header">
                            <h5 className="accept-invite-title">Invitation Declined</h5>
                            <p className="accept-invite-subtitle">You have declined this invitation.</p>
                        </div>
                    </div>
                </div>
            </FixedLayout>
        );
    }

    if (errors.general && !invitationData) {
        return (
            <FixedLayout>
                <div className="accept-invite-page">
                    <div className="accept-invite-card">
                        <div className="accept-invite-header">
                            <h5 className="accept-invite-title">Invalid Invitation</h5>
                            <p className="accept-invite-subtitle">{errors.general}</p>
                            <button
                                className="accept-invite-btn"
                                onClick={() => navigate("/login")}
                            >
                                Go to Login
                            </button>
                        </div>
                    </div>
                </div>
            </FixedLayout>
        );
    }

    return (
        <FixedLayout>
            <div className="accept-invite-page">
                <div className="accept-invite-card">
                    <div className="accept-invite-header">
                        <h5 className="accept-invite-title">You've Been Invited to Join Firm!</h5>
                        <p className="accept-invite-subtitle">
                            Hello {invitationData?.first_name ? `${invitationData.first_name} ${invitationData.last_name || ''}`.trim() : invitationData?.email || "Staff"},
                        </p>
                    </div>

                    {errors.general && (
                        <div className="alert alert-danger" role="alert">
                            {errors.general}
                        </div>
                    )}

                    {errors.token && errors.token.length > 0 && (
                        <div className="alert alert-danger" role="alert">
                            {Array.isArray(errors.token) ? errors.token[0] : errors.token}
                        </div>
                    )}

                    <div className="invitation-details">
                        <p className="invitation-text">
                            You have been invited to join <strong>{invitationData?.firm_name || "Firm"}</strong> as a{" "}
                            <strong>{invitationData?.role_display || invitationData?.role || "Staff"}</strong> on the Seqwens platform.
                        </p>

                        {invitationData?.expires_at_formatted && (
                            <p className="expiration-text">
                                This invitation will expire on <strong>{invitationData.expires_at_formatted}</strong>.
                            </p>
                        )}

                        {invitationData?.invited_by_name && (
                            <p className="invitation-text" style={{ fontSize: "14px", opacity: 0.9 }}>
                                Invited by: <strong>{invitationData.invited_by_name}</strong>
                            </p>
                        )}

                        <p className="invitation-instruction">
                            Please create your account password to accept this invitation:
                        </p>
                    </div>

                    <form onSubmit={handleAcceptInvitation}>
                        {/* Only show form if invitation is valid */}
                        {invitationData && invitationData.is_valid !== false && !errors.token ? (
                            <>
                                {/* Password Field */}
                                <div className="form-group mb-3">
                                    <label className="form-label" style={{ color: "#ffffff", fontSize: "14px", fontWeight: "500", marginBottom: "8px", display: "block" }}>
                                        Password
                                    </label>
                                    <div style={{ position: "relative" }}>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                if (errors.password) {
                                                    setErrors(prev => ({ ...prev, password: '' }));
                                                }
                                            }}
                                            style={{
                                                width: "100%",
                                                padding: "10px 40px 10px 12px",
                                                borderRadius: "5px",
                                                border: errors.password ? "1px solid #ef4444" : "1px solid rgba(255, 255, 255, 0.3)",
                                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                                                color: "#ffffff",
                                                fontSize: "14px"
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: "absolute",
                                                right: "10px",
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                background: "none",
                                                border: "none",
                                                color: "#ffffff",
                                                cursor: "pointer",
                                                fontSize: "16px"
                                            }}
                                        >
                                            {showPassword ? "👁️" : "👁️‍🗨️"}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <div className="invalid-feedback" style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                                            {errors.password}
                                        </div>
                                    )}
                                    <div style={{ color: "#ffffff", fontSize: "12px", marginTop: "4px", opacity: 0.8 }}>
                                        Must contain: 8+ characters, uppercase, lowercase, number, special character
                                    </div>
                                </div>

                                {/* Confirm Password Field */}
                                <div className="form-group mb-3">
                                    <label className="form-label" style={{ color: "#ffffff", fontSize: "14px", fontWeight: "500", marginBottom: "8px", display: "block" }}>
                                        Confirm Password
                                    </label>
                                    <div style={{ position: "relative" }}>
                                        <input
                                            type={showPasswordConfirm ? "text" : "password"}
                                            className={`form-control ${errors.passwordConfirm ? 'is-invalid' : ''}`}
                                            placeholder="Confirm your password"
                                            value={passwordConfirm}
                                            onChange={(e) => {
                                                setPasswordConfirm(e.target.value);
                                                if (errors.passwordConfirm) {
                                                    setErrors(prev => ({ ...prev, passwordConfirm: '' }));
                                                }
                                            }}
                                            style={{
                                                width: "100%",
                                                padding: "10px 40px 10px 12px",
                                                borderRadius: "5px",
                                                border: errors.passwordConfirm ? "1px solid #ef4444" : "1px solid rgba(255, 255, 255, 0.3)",
                                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                                                color: "#ffffff",
                                                fontSize: "14px"
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                            style={{
                                                position: "absolute",
                                                right: "10px",
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                background: "none",
                                                border: "none",
                                                color: "#ffffff",
                                                cursor: "pointer",
                                                fontSize: "16px"
                                            }}
                                        >
                                            {showPasswordConfirm ? "👁️" : "👁️‍🗨️"}
                                        </button>
                                    </div>
                                    {errors.passwordConfirm && (
                                        <div className="invalid-feedback" style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                                            {errors.passwordConfirm}
                                        </div>
                                    )}
                                </div>

                                {/* Phone Number Field (Optional) */}
                                <div className="form-group mb-3">
                                    <label className="form-label" style={{ color: "#ffffff", fontSize: "14px", fontWeight: "500", marginBottom: "8px", display: "block" }}>
                                        Phone Number <span style={{ fontSize: "12px", opacity: 0.7 }}>(Optional)</span>
                                    </label>
                                    <PhoneInput
                                        country={phoneCountry}
                                        value={phoneNumber || ''}
                                        onChange={(phone) => {
                                            setPhoneNumber(phone);
                                            if (errors.phoneNumber) {
                                                setErrors(prev => ({ ...prev, phoneNumber: '' }));
                                            }
                                        }}
                                        onCountryChange={(countryCode) => {
                                            setPhoneCountry(countryCode.toLowerCase());
                                        }}
                                        inputClass={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                                        containerClass="w-100 phone-input-container"
                                        inputStyle={{
                                            width: "100%",
                                            padding: "10px 12px 10px 48px",
                                            borderRadius: "5px",
                                            border: errors.phoneNumber ? "1px solid #ef4444" : "1px solid rgba(255, 255, 255, 0.3)",
                                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                                            color: "#ffffff",
                                            fontSize: "14px"
                                        }}
                                        buttonStyle={{
                                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                                            border: "1px solid rgba(255, 255, 255, 0.3)",
                                            borderRadius: "5px 0 0 5px"
                                        }}
                                        dropdownStyle={{
                                            backgroundColor: "#1a1a1a",
                                            color: "#ffffff"
                                        }}
                                        enableSearch={true}
                                        countryCodeEditable={false}
                                    />
                                    {errors.phoneNumber && (
                                        <div className="invalid-feedback" style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                                            {errors.phoneNumber}
                                        </div>
                                    )}
                                </div>

                                <div className="invitation-actions">
                                    <button
                                        type="submit"
                                        className="accept-invite-btn accept-btn"
                                        disabled={isAccepting || isDenying || (invitationData && invitationData.is_valid === false)}
                                    >
                                        {isAccepting ? "Creating Account..." : "Accept Invitation & Create Account"}
                                    </button>
                                    <button
                                        type="button"
                                        className="accept-invite-btn deny-btn"
                                        onClick={handleDenyInvitation}
                                        disabled={isAccepting || isDenying || (invitationData && invitationData.is_valid === false)}
                                    >
                                        {isDenying ? "Declining..." : "Deny Invitation"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="invitation-actions">
                                <button
                                    className="accept-invite-btn accept-btn"
                                    onClick={() => navigate("/login")}
                                >
                                    Go to Login
                                </button>
                            </div>
                        )}
                    </form>

                    <div className="invitation-footer">
                        <p className="invitation-footer-text">
                            If you did not expect this invitation, you can safely ignore this page.
                        </p>
                        <p className="invitation-footer-signature">
                            Best regards,<br />
                            The {invitationData?.firm_name || "Firm"} Team
                        </p>
                    </div>
                </div>
            </div>
        </FixedLayout>
    );
}

