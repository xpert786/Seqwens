import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/AcceptInvite.css";
import FixedLayout from "../components/FixedLayout";
import { invitationAPI, clientInviteAPI, handleAPIError, validatePassword } from "../utils/apiUtils";
import { setTokens } from "../utils/userUtils";
import { toast } from "react-toastify";
import DataSharingModal from "../components/DataSharingModal";
import { getPathWithPrefix, getLoginUrl } from "../utils/urlUtils";
import { useFirmPortalColors } from "../../FirmAdmin/Context/FirmPortalColorsContext";

export default function AcceptInvite() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const { updateBranding } = useFirmPortalColors();
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
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    // Client invite data sharing state
    const [isClientInvite, setIsClientInvite] = useState(false);
    const [existingGrant, setExistingGrant] = useState(null);
    const [showDataSharingModal, setShowDataSharingModal] = useState(false);
    const [dataSharingDecision, setDataSharingDecision] = useState(null);

    // Confirmation modal state
    const [showAcceptConfirmModal, setShowAcceptConfirmModal] = useState(false);
    const [showDeclineConfirmModal, setShowDeclineConfirmModal] = useState(false);

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

                // Try client invite validation first (since client invites are more common for taxpayers)
                console.log('Validating client invitation with token:', token);
                let response;
                let isClient = false;

                try {
                    response = await clientInviteAPI.validateClientInvite(token);
                    isClient = true;
                    setIsClientInvite(true);
                    console.log('Client invite validation response:', response);
                } catch (clientError) {
                    // If client invite validation fails, try staff invite
                    console.log('Client invite validation failed, trying staff invite:', clientError);
                    response = await invitationAPI.validateInvitation(token);
                    isClient = false;
                    setIsClientInvite(false);
                    console.log('Staff invite validation response:', response);
                }

                console.log('=== VALIDATION RESPONSE DEBUG ===');
                console.log('response.success:', response.success);
                console.log('response.is_valid:', response.is_valid);
                console.log('response.requires_signin:', response.requires_signin);
                console.log('response.data:', response.data);
                console.log('response.message:', response.message);
                console.log('response.validation_errors:', response.validation_errors);
                console.log('=== LOCALSTORAGE DEBUG ===');
                console.log('localStorage.isLoggedIn:', localStorage.getItem("isLoggedIn"));
                console.log('sessionStorage.isLoggedIn:', sessionStorage.getItem("isLoggedIn"));
                console.log('localStorage.userData:', localStorage.getItem("userData"));
                console.log('sessionStorage.userData:', sessionStorage.getItem("userData"));
                console.log('localStorage.accessToken:', localStorage.getItem("accessToken"));
                console.log('sessionStorage.accessToken:', sessionStorage.getItem("accessToken"));
                console.log('=========================');

                if (response.success && response.is_valid && response.data) {
                    console.log('Invitation is valid');

                    // Apply firm branding from invitation data
                    if (response.data.branding) {
                        updateBranding(response.data.branding);
                    }

                    // Check if backend says user needs to sign in
                    if (response.requires_signin === true) {
                        console.log('Backend says requires_signin is true');
                        // Check both localStorage and sessionStorage for login status
                        const isUserLoggedIn =
                            localStorage.getItem("isLoggedIn") === "true" ||
                            sessionStorage.getItem("isLoggedIn") === "true";
                        console.log('User logged in status:', isUserLoggedIn);

                        if (isUserLoggedIn) {
                            // User is logged in, allow them to accept
                            console.log('User is logged in, allowing acceptance');
                            const newInvitationData = {
                                ...response.data,
                                user_exists: true,
                                is_valid: true
                            };
                            console.log('Setting invitationData to:', newInvitationData);
                            setInvitationData(newInvitationData);
                            console.log('NOT setting errors - user should see accept/decline buttons');
                            // Explicitly clear any errors to ensure clean state
                            setErrors({});
                            // Don't set errors - user can proceed
                        } else {
                            // User is not logged in, show sign-in prompt
                            console.log('User is NOT logged in, showing sign-in prompt');
                            setInvitationData(response.data);
                            setErrors({
                                general: response.message || "An account already exists for this email. Please sign in to accept the invite.",
                                existingEmail: true
                            });
                        }
                    } else {
                        // New user - no account exists
                        console.log('New user invitation, no existing account');
                        setInvitationData(response.data);
                    }

                    // Check for existing grant (client invites only)
                    if (isClient && response.existing_grant?.has_existing_grant) {
                        setExistingGrant(response.existing_grant);
                    }

                    // Also check for existing grant from staff/general invites
                    if (response.existing_grant?.has_existing_grant) {
                        setExistingGrant(response.existing_grant);
                    } else if (response.data.existing_grant?.has_existing_grant) {
                        setExistingGrant(response.data.existing_grant);
                    }
                } else {
                    console.log('Invitation validation failed or has issues');
                    // Handle error cases
                    const errorMessage = response.message || "Invalid invitation token.";
                    const tokenErrors = response.errors?.token || [];
                    const validationErrors = response.validation_errors || [];

                    console.log('errorMessage:', errorMessage);
                    console.log('tokenErrors:', tokenErrors);
                    console.log('validationErrors:', validationErrors);

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


    // Handle form submission - show confirmation modal
    const handleAcceptInvitation = async (e) => {
        e?.preventDefault();

        if (!token) {
            setErrors({ general: "Invalid invitation token." });
            return;
        }

        // Check if we need to show data sharing modal first (before form validation)
        if (isClientInvite && existingGrant?.has_existing_grant && !dataSharingDecision) {
            setShowDataSharingModal(true);
            return;
        }

        // Clear previous errors
        const newErrors = {};

        // Validate password only if user creates a new account
        if (!invitationData?.user_exists) {
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
        }

        // If there are validation errors, set them and return
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // For existing users, validate password before showing modal
        if (invitationData?.user_exists) {
            if (!password) {
                setErrors({ password: "Please enter your password to confirm." });
                return;
            }
        }

        // Show confirmation modal instead of directly accepting
        setShowAcceptConfirmModal(true);
    };

    // Confirm acceptance from modal
    const confirmAcceptInvitation = async () => {
        setShowAcceptConfirmModal(false);
        await performAcceptInvitation(dataSharingDecision);
    };




    // Handle data sharing decision confirmation
    const handleDataSharingConfirm = async (decision) => {
        setDataSharingDecision(decision);
        setShowDataSharingModal(false);
        // Proceed with invitation acceptance
        await performAcceptInvitation(decision);
    };

    // Perform the actual invitation acceptance
    const performAcceptInvitation = async (dataSharingDecision = null) => {
        setIsAccepting(true);
        setErrors({});

        try {
            let response;

            // For existing users, password_confirm should match password
            const confirmPassword = invitationData?.user_exists ? password : passwordConfirm;

            if (isClientInvite) {
                // Use client invite API
                response = await clientInviteAPI.acceptClientInvite(
                    token,
                    password,
                    confirmPassword,
                    null, // Phone number removed
                    dataSharingDecision?.scope || null,
                    dataSharingDecision?.selectedCategories || null
                );
            } else {
                // Use staff invite API
                response = await invitationAPI.acceptInvitation(
                    token,
                    password,
                    confirmPassword,
                    null // Phone number removed
                );
            }

            // Check if API returns a warning response requiring data sharing decision
            if (response.requires_data_sharing_decision && isClientInvite) {
                // Show data sharing modal with warning
                setShowDataSharingModal(true);
                setExistingGrant({
                    has_existing_grant: true,
                    current_firm: response.warning?.current_firm,
                    warning_message: response.warning?.message || response.message,
                    requires_data_sharing_decision: true,
                    data_sharing_options: response.data_sharing_options
                });
                setIsAccepting(false);
                return;
            }

            if (response.success && response.data) {
                setIsAccepted(true);

                // Store user data if provided
                if (response.data.user) {
                    const user = response.data.user;

                    // Check if this was an existing user linking a new role
                    if (invitationData?.user_exists && response.data.tokens) {
                        // User was already logged in and accepted invitation
                        // Update their tokens and redirect to role selection
                        const { setTokens } = require('../utils/userUtils');
                        setTokens(
                            response.data.tokens.access,
                            response.data.tokens.refresh,
                            true
                        );

                        // Update user data in storage
                        const storage = localStorage.getItem("isLoggedIn") ? localStorage : sessionStorage;
                        storage.setItem("userData", JSON.stringify(user));

                        toast.success(response.message || "Invitation accepted successfully!", {
                            position: "top-right",
                            autoClose: 2000,
                        });

                        // Redirect to role selection page
                        setTimeout(() => {
                            navigate("/select-role", {
                                state: {
                                    fromInvitation: true,
                                    userData: user,
                                    message: "Please select your role to continue"
                                },
                                replace: true
                            });
                        }, 2000);
                    } else {
                        // New user account created - redirect to login
                        toast.success(response.message || "Account created successfully! Please log in to continue.", {
                            position: "top-right",
                            autoClose: 3000,
                        });
                    }

                } else {
                    // No user data (unlikely but possible), show success message
                    toast.success(response.message || "Invitation accepted successfully!", {
                        position: "top-right",
                        autoClose: 3000,
                    });
                }

            } else {
                // Check for duplicate invite error
                const errorMessage = response.message || "Failed to accept invitation.";
                const isDuplicateInvite = errorMessage.toLowerCase().includes('already has access') ||
                    errorMessage.toLowerCase().includes('already exists');

                if (isDuplicateInvite) {
                    setErrors({
                        general: errorMessage,
                        duplicateInvite: true
                    });
                } else {
                    setErrors({ general: errorMessage });
                }
            }
        } catch (error) {
            console.error('Error accepting invitation:', error);

            // Check for duplicate invite in error message
            const errorMessage = handleAPIError(error);
            const isDuplicateInvite = errorMessage.toLowerCase().includes('already has access') ||
                errorMessage.toLowerCase().includes('already exists');

            if (isDuplicateInvite) {
                setErrors({
                    general: errorMessage,
                    duplicateInvite: true
                });
            } else {
                // Handle API error response
                const fieldErrors = {};
                const parsedErrorMessage = error.message || handleAPIError(error);

                // Parse error message to extract field-specific errors
                // Error format from publicApiRequest: "Validation failed. password: error1, error2; phone_number: error3"
                if (parsedErrorMessage.includes(':')) {
                    // Try to extract field errors from the message
                    const parts = parsedErrorMessage.split(';');
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
                        fieldErrors.general = parsedErrorMessage;
                    } else if (generalMessage && !fieldErrors.general) {
                        fieldErrors.general = generalMessage;
                    }
                } else {
                    // Simple error message without field structure
                    // Try to detect field from message content
                    const errorLower = parsedErrorMessage.toLowerCase();
                    if (errorLower.includes('password') && errorLower.includes('match')) {
                        fieldErrors.passwordConfirm = parsedErrorMessage;
                    } else if (errorLower.includes('password')) {
                        fieldErrors.password = parsedErrorMessage;
                    } else if (errorLower.includes('phone')) {
                        fieldErrors.phoneNumber = parsedErrorMessage;
                    } else if (errorLower.includes('token')) {
                        fieldErrors.general = parsedErrorMessage;
                    } else {
                        fieldErrors.general = parsedErrorMessage;
                    }
                }

                setErrors(fieldErrors);
            }
        } finally {
            setIsAccepting(false);
        }
    };

    const handleDenyInvitation = async () => {
        // Show confirmation modal instead of directly declining
        setShowDeclineConfirmModal(true);
    };

    const confirmDenyInvitation = async () => {
        setShowDeclineConfirmModal(false);

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

    // Determine new firm name from invitation data
    const newFirmName = invitationData?.firm_name || invitationData?.firm?.name;

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
                            <p className="accept-invite-subtitle">Your account has been created successfully. Please log in to continue.</p>
                            <div className="invitation-actions">
                                <button
                                    className="accept-invite-btn accept-btn"
                                    onClick={() => window.location.href = getLoginUrl()}
                                >
                                    Log In
                                </button>
                            </div>
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

    // Handle existing email scenario or existing user not logged in
    const isLoggedIn =
        localStorage.getItem("isLoggedIn") === "true" ||
        sessionStorage.getItem("isLoggedIn") === "true";

    console.log('=== RENDER CONDITION DEBUG ===');
    console.log('errors.existingEmail:', errors.existingEmail);
    console.log('invitationData?.user_exists:', invitationData?.user_exists);
    console.log('isLoggedIn:', isLoggedIn);
    console.log('invitationData:', invitationData);
    console.log('errors:', errors);

    if ((errors.existingEmail || (invitationData?.user_exists && !isLoggedIn)) && invitationData) {
        console.log('Rendering "Sign In" prompt screen');
        return (
            <FixedLayout>
                <div className="accept-invite-page">
                    <div className="accept-invite-card">
                        <div className="accept-invite-header">
                            <h5 className="accept-invite-title">Invitation from {invitationData?.firm_name || "Firm"}</h5>
                            <p className="accept-invite-subtitle">
                                You've been invited to join <strong>{invitationData?.firm_name || "Firm"}</strong> as a{" "}
                                <strong>{invitationData?.role_display || invitationData?.role || "Member"}</strong>
                            </p>
                        </div>
                        <div className="alert alert-warning" role="alert" style={{
                            margin: '1.5rem 0',
                            padding: '1rem',
                            backgroundColor: '#FFF3CD',
                            border: '1px solid #FFC107',
                            borderRadius: '8px',
                            color: '#856404'
                        }}>
                            <strong>⚠️ {errors.general || "An account already exists for this email."}</strong>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '14px' }}>
                                Please sign in to accept the invite.
                            </p>
                        </div>
                        <div className="invitation-actions" style={{ marginTop: '1.5rem' }}>
                            <button
                                className="accept-invite-btn accept-btn"
                                onClick={() => {
                                    const returnPath = `/accept-invite?token=${token}`;
                                    navigate(`/login?returnTo=${encodeURIComponent(returnPath)}`, {
                                        state: {
                                            returnTo: returnPath,
                                            message: "Please sign in to accept the invitation"
                                        }
                                    });
                                }}
                            >
                                Sign In
                            </button>
                            <button
                                className="accept-invite-btn deny-btn"
                                onClick={() => navigate("/login", {
                                    state: {
                                        forgotPassword: true,
                                        email: invitationData?.email
                                    }
                                })}
                                style={{ marginTop: '0.5rem' }}
                            >
                                Forgot Password?
                            </button>
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

    // Main return with Data Sharing Modal
    return (
        <>
            {/* Original return content stays here - will be rendered below */}
            {isLoading ? (
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
            ) : isAccepted ? (
                <FixedLayout>
                    <div className="accept-invite-page">
                        <div className="accept-invite-card">
                            <div className="accept-invite-header">
                                <h5 className="accept-invite-title">Invitation Accepted!</h5>
                                <p className="accept-invite-subtitle">Your account has been created successfully. Please log in to continue.</p>
                                <div className="invitation-actions">
                                    <button
                                        className="accept-invite-btn accept-btn"
                                        onClick={() => window.location.href = getLoginUrl()}
                                    >
                                        Log In
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </FixedLayout>
            ) : isDenied ? (
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
            ) : errors.general && !invitationData ? (
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
            ) : (
                <FixedLayout>
                    <div className="accept-invite-page">
                        <div className="accept-invite-card">
                            <div className="accept-invite-header">
                                <h5 className="accept-invite-title">You've Been Invited to Join {invitationData?.firm_name || "a Firm"}!</h5>
                                <p className="accept-invite-subtitle">
                                    Hello {invitationData?.first_name ? `${invitationData.first_name} ${invitationData.last_name || ''}`.trim() : invitationData?.email || "Staff"},
                                </p>
                            </div>

                            {errors.duplicateInvite && (
                                <div className="alert alert-warning" role="alert" style={{
                                    backgroundColor: '#FFF3CD',
                                    border: '1px solid #FFC107',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    color: '#856404',
                                    marginBottom: '1rem'
                                }}>
                                    <strong>⚠️ {errors.general || "This user already has access to your firm."}</strong>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '14px' }}>
                                        You can update their office assignments or permissions instead.
                                    </p>
                                    <button
                                        className="btn  btn-primary mt-2"
                                        onClick={() => navigate("/firmadmin/staff")}
                                        style={{ marginTop: '0.5rem' }}
                                    >
                                        Go to Staff Management
                                    </button>
                                </div>
                            )}

                            {errors.general && !errors.duplicateInvite && (
                                <div className="alert alert-danger" role="alert">
                                    {errors.general}
                                </div>
                            )}

                            {errors.token && errors.token.length > 0 && (
                                <div className="alert alert-danger" role="alert">
                                    {Array.isArray(errors.token) ? errors.token[0] : errors.token}
                                </div>
                            )}

                            {/* Show existing grant warning if present */}
                            {existingGrant?.has_existing_grant && !showDataSharingModal && (
                                <div className="alert alert-warning" role="alert" style={{ marginBottom: '1rem' }}>
                                    <strong>Note:</strong> {existingGrant.warning_message || 'Accepting this invite will affect your current tax office access.'}
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

                                {!invitationData?.user_exists && (
                                    <p className="invitation-instruction">
                                        Please create your account password to accept this invitation:
                                    </p>
                                )}
                                {invitationData?.user_exists && (
                                    <p className="invitation-instruction">
                                        Please confirm that you would like to connect your account to this firm:
                                    </p>
                                )}
                            </div>

                            <form onSubmit={handleAcceptInvitation}>
                                {/* Only show form if invitation is valid OR we forced it to be valid for logged-in users */}
                                {invitationData && (invitationData.is_valid !== false || invitationData.is_valid === true) && !errors.token ? (
                                    <>
                                        {/* Password Field */}
                                        {!invitationData.user_exists && !isLoggedIn && (
                                            <>
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
                                                <div className="form-group mb-4">
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
                                            </>
                                        )}

                                        {/* Password field for existing users who are logged in */}
                                        {invitationData?.user_exists && isLoggedIn && (
                                            <div style={{ marginBottom: "1rem" }}>
                                                <label style={{
                                                    display: "block",
                                                    marginBottom: "8px",
                                                    color: "#ffffff",
                                                    fontSize: "14px",
                                                    fontWeight: "500"
                                                }}>
                                                    Confirm Your Password <span style={{ color: "#ef4444" }}>*</span>
                                                </label>
                                                <div style={{ position: "relative" }}>
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        value={password}
                                                        onChange={(e) => {
                                                            setPassword(e.target.value);
                                                            if (errors.password) {
                                                                setErrors(prev => ({ ...prev, password: '' }));
                                                            }
                                                        }}
                                                        placeholder="Enter your password to confirm"
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
                                                <p style={{
                                                    fontSize: "12px",
                                                    color: "rgba(255, 255, 255, 0.7)",
                                                    marginTop: "6px",
                                                    fontStyle: "italic"
                                                }}>
                                                    Please enter your password to link this firm to your existing account.
                                                </p>
                                            </div>
                                        )}


                                        <div className="d-grid gap-2">
                                            <button
                                                type="submit"
                                                className="accept-invite-btn"
                                                disabled={isAccepting}
                                            >
                                                {isAccepting ? "Processing..." : (invitationData.user_exists ? "Accept & Connect" : "Accept Invitation")}
                                            </button>

                                            <button
                                                type="button"
                                                className="accept-invite-btn deny-btn"
                                                onClick={handleDenyInvitation}
                                                disabled={isDenying || isAccepting}
                                            >
                                                {isDenying ? "Declining..." : "Decline Invitation"}
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
            )}

            {/* Data Sharing Modal */}
            {existingGrant && (
                <DataSharingModal
                    show={showDataSharingModal}
                    onClose={() => setShowDataSharingModal(false)}
                    onConfirm={handleDataSharingConfirm}
                    currentFirm={existingGrant.current_firm}
                    newFirm={{ name: newFirmName }}
                    warningMessage={existingGrant.warning_message}
                    dataSharingOptions={existingGrant.data_sharing_options}
                    loading={isAccepting}
                />
            )}

            {/* Accept Invitation Confirmation Modal */}
            {showAcceptConfirmModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                    style={{ zIndex: 10000 }}
                    onClick={() => {
                        if (!isAccepting) {
                            setShowAcceptConfirmModal(false);
                        }
                    }}
                >
                    <div
                        className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4"
                        style={{ borderRadius: '12px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900" style={{ color: '#3B4A66' }}>
                                {invitationData?.user_exists ? 'Link Your Account' : 'Accept Invitation'}
                            </h3>
                            <button
                                onClick={() => {
                                    if (!isAccepting) {
                                        setShowAcceptConfirmModal(false);
                                    }
                                }}
                                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                                disabled={isAccepting}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="#3B4A66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-700 font-[BasisGrotesquePro] mb-3">
                                {invitationData?.user_exists ? (
                                    <>
                                        You are about to link your existing account to <strong>{invitationData?.firm_name || "this firm"}</strong> as a <strong>{invitationData?.role_display || invitationData?.role || "member"}</strong>.
                                    </>
                                ) : (
                                    <>
                                        You are about to accept the invitation to join <strong>{invitationData?.firm_name || "this firm"}</strong> as a <strong>{invitationData?.role_display || invitationData?.role || "member"}</strong>.
                                    </>
                                )}
                            </p>



                            {!invitationData?.user_exists && (
                                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-2">
                                    Do you want to proceed?
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowAcceptConfirmModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-[BasisGrotesquePro]"
                                disabled={isAccepting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAcceptInvitation}
                                className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity font-[BasisGrotesquePro] flex items-center"
                                style={{ backgroundColor: '#00C0C6' }}
                                disabled={isAccepting}
                            >
                                {isAccepting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    invitationData?.user_exists ? 'Yes, Link Account' : 'Yes, Accept'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Decline Invitation Confirmation Modal */}
            {showDeclineConfirmModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                    style={{ zIndex: 10000 }}
                    onClick={() => {
                        if (!isDenying) {
                            setShowDeclineConfirmModal(false);
                        }
                    }}
                >
                    <div
                        className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4"
                        style={{ borderRadius: '12px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900" style={{ color: '#3B4A66' }}>Decline Invitation</h3>
                            <button
                                onClick={() => {
                                    if (!isDenying) {
                                        setShowDeclineConfirmModal(false);
                                    }
                                }}
                                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                                disabled={isDenying}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="#3B4A66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-700 font-[BasisGrotesquePro] mb-3">
                                Are you sure you want to decline this invitation from <strong>{invitationData?.firm_name || "this firm"}</strong>?
                            </p>
                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                                This action cannot be undone. You will need to request a new invitation if you change your mind.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeclineConfirmModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-[BasisGrotesquePro]"
                                disabled={isDenying}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDenyInvitation}
                                className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity font-[BasisGrotesquePro] flex items-center"
                                style={{ backgroundColor: '#EF4444' }}
                                disabled={isDenying}
                            >
                                {isDenying ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    'Yes, Decline'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

