import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/Login.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import FixedLayout from "../components/FixedLayout";
import { userAPI, validateEmail, handleAPIError } from "../utils/apiUtils";
import { setTokens, getStorage, clearUserData } from "../utils/userUtils";
import TwoFactorCodeInput from "../components/TwoFactorCodeInput";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // 2FA states
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState(null);
  const [twoFactorMessage, setTwoFactorMessage] = useState('');
  const [twoFactorInstructions, setTwoFactorInstructions] = useState('');
  const [twoFactorUIHints, setTwoFactorUIHints] = useState(null);

  // Restore rememberMe state and email from storage on component mount
  useEffect(() => {
    // Check localStorage first (persistent)
    const localRememberMe = localStorage.getItem("rememberMe");
    const localEmail = localStorage.getItem("rememberedEmail");

    // Check sessionStorage (session-based)
    const sessionRememberMe = sessionStorage.getItem("rememberMe");
    const sessionEmail = sessionStorage.getItem("rememberedEmail");

    // Restore rememberMe state (prefer localStorage if exists)
    if (localRememberMe !== null) {
      setRememberMe(localRememberMe === "true");
      // Restore email if rememberMe was true
      if (localRememberMe === "true" && localEmail) {
        setEmail(localEmail);
      }
    } else if (sessionRememberMe !== null) {
      setRememberMe(sessionRememberMe === "true");
      // Restore email if rememberMe was true
      if (sessionRememberMe === "true" && sessionEmail) {
        setEmail(sessionEmail);
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validate form
    if (!password.trim() && !email.trim()) {
      setErrors({
        email: 'Please enter your email',
        password: 'Please enter your password'
      });
      return;
    }

    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    if (!password.trim()) {
      setErrors({ password: 'Password is required' });
      return;
    }



    setIsLoading(true);

    try {
      const response = await userAPI.login({ email, password });

      // Check if 2FA is required - DISABLED
      // if (response.requires_2fa === true) {
      //   setRequires2FA(true);
      //   setTwoFactorMessage(response.message || 'Please enter your 2FA code to complete login');
      //   setTwoFactorInstructions(response.instructions || '');
      //   setTwoFactorUIHints(response.ui_hints || null);
      //   setIsLoading(false);
      //   return;
      // }

      // If 2FA is not required, proceed with normal login
      await completeLogin(response);
    } catch (error) {
      console.error('Login error:', error);



      setErrors({
        general: handleAPIError(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completeLogin = async (response) => {
    // Clear any previous session data (including impersonation markers)
    clearUserData();

    // Choose storage based on Remember Me selection
    const storage = rememberMe ? localStorage : sessionStorage;

    // Store user data
    storage.setItem("isLoggedIn", "true");
    storage.setItem("userData", JSON.stringify(response.user || response.data?.user));

    // Store firms data from login response for AccountSwitcher
    if (response.firms && Array.isArray(response.firms)) {
      storage.setItem("firmsData", JSON.stringify(response.firms));
    }

    // Store email if rememberMe is checked
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email);
      // Clear from sessionStorage if it exists
      sessionStorage.removeItem("rememberedEmail");
    } else {
      // Store in sessionStorage for current session only
      sessionStorage.setItem("rememberedEmail", email);
      // Clear from localStorage if it exists
      localStorage.removeItem("rememberedEmail");
    }

    const accessToken = response.access_token || response.data?.access;
    const refreshToken = response.refresh_token || response.data?.refresh;
    // Set tokens first so they are available for the new route
    setTokens(accessToken, refreshToken, rememberMe);

    // Check for returnTo in location state - do this BEFORE any other navigation
    if (location.state && location.state.returnTo) {
      console.log(`Redirecting to returnTo path: ${location.state.returnTo}`);
      navigate(location.state.returnTo);
      return;
    }

    // Check user type and navigate to appropriate dashboard
    const user = response.user || response.data?.user;
    const userType = user.user_type;
    const roles = user.role; // Array of roles from API response
    const customRole = user.custom_role; // Custom role object if exists

    console.log('User logged in with type:', userType);
    console.log('User roles:', roles);
    console.log('Custom role:', customRole);

    // Check if user has custom role and role is tax_preparer
    // If custom_role exists, user should use tax preparer dashboard
    if (customRole && roles && Array.isArray(roles) && roles.includes('tax_preparer')) {
      // Store custom role data
      storage.setItem("userType", 'tax_preparer');
      storage.setItem("customRole", JSON.stringify(customRole));

      // Redirect to tax preparer dashboard
      navigate("/taxdashboard");
      return;
    }

    // Check if user has multiple roles
    if (roles && Array.isArray(roles) && roles.length > 1) {
      // User has multiple roles, show role selection screen
      navigate("/select-role", {
        state: { userData: user },
        replace: true
      });
      return;
    }

    // Single role - proceed with normal navigation
    // Store user type in storage for future reference
    storage.setItem("userType", userType);

    // Route based on user type
    if (userType === 'super_admin') {
      // Redirect to super admin dashboard
      navigate("/superadmin");
    } else if (userType === 'support_admin' || userType === 'billing_admin') {
      // Redirect to admin dashboard
      navigate("/superadmin");
    } else if (userType === 'admin' || userType === 'firm') {
      if (user.subscription_plan === null || user.subscription_plan === undefined) {
        // Check if admin/firm user has no subscription plan
        navigate("/firmadmin/finalize-subscription", { replace: true });
      } else {
        // Redirect to firm admin dashboard
        navigate("/firmadmin");
      }
    } else if (userType === 'tax_preparer') {
      // Redirect to tax preparer dashboard
      navigate("/taxdashboard");
    } else if (userType === 'client' || !userType) {
      // Client routing - check verification status
      const isEmailVerified = user.is_email_verified;
      const isPhoneVerified = user.is_phone_verified;
      const isCompleted = user.is_completed;

      // If neither email nor phone is verified, go to two-factor authentication
      if (!isEmailVerified && !isPhoneVerified) {
        navigate("/two-auth");
      } else {
        // If either email or phone is verified, check completion status
        if (isCompleted) {
          // User is completed, go to main dashboard
          navigate("/dashboard");
        } else {
          // User is not completed, stay on dashboard-first page
          navigate("/dashboard-first");
        }
      }
    } else {
      // Fallback for unknown user types
      console.warn('Unknown user type:', userType);
      navigate("/dashboard");
    }
  };

  const handleVerify2FA = async (code) => {
    if (!code || code.length !== 6) {
      setTwoFactorError('Please enter a valid 6-digit code');
      return;
    }

    setVerifying2FA(true);
    setTwoFactorError(null);

    try {
      const response = await userAPI.verify2FALogin(email, code);

      if (response.success) {
        // 2FA verified, complete login
        await completeLogin(response.data || response);
      } else {
        throw new Error(response.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      const errorMessage = handleAPIError(error);
      setTwoFactorError(errorMessage);
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleBackToLogin = () => {
    setRequires2FA(false);
    setTwoFactorCode('');
    setTwoFactorError(null);
    setTwoFactorMessage('');
    setTwoFactorInstructions('');
    setTwoFactorUIHints(null);
    setPassword('');
  };

  // Get UI hints with defaults
  const getUIHints = () => {
    if (twoFactorUIHints) {
      return {
        inputPlaceholder: twoFactorUIHints.input_placeholder || 'Enter 6-digit code',
        inputType: twoFactorUIHints.input_type || 'numeric',
        inputMaxLength: twoFactorUIHints.input_max_length || 6,
        backgroundColor: twoFactorUIHints.background_color || '#ffffff',
        textColor: twoFactorUIHints.text_color || '#000000',
        borderColor: twoFactorUIHints.border_color || '#007bff',
        focusBorderColor: twoFactorUIHints.focus_border_color || '#0056b3',
        errorColor: twoFactorUIHints.error_color || '#dc3545',
        successColor: twoFactorUIHints.success_color || '#28a745',
      };
    }
    // Default values if no UI hints provided
    return {
      inputPlaceholder: 'Enter 6-digit code',
      inputType: 'numeric',
      inputMaxLength: 6,
      backgroundColor: '#ffffff',
      textColor: '#000000',
      borderColor: '#007bff',
      focusBorderColor: '#0056b3',
      errorColor: '#dc3545',
      successColor: '#28a745',
    };
  };

  return (
    <FixedLayout>
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <h5 className="login-title">WELCOME BACK</h5>
            <p className="login-subtitle">Sign in to your account to continue</p>
          </div>

          {errors.general && (
            <div className="alert alert-danger" role="alert">
              {errors.general}
            </div>
          )}

          {!requires2FA ? (
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label className="form-label">Email or Username</label>
                <input
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="Enter your email or username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                />
                {errors.email && (
                  <div className="invalid-feedback">{errors.email}</div>
                )}
              </div>

              <div className="form-group password-group">
                <label className="form-label">Password</label>
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
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password"
                >
                  {showPassword ? <FaEye /> : <FaEyeSlash />}
                </span>
                {errors.password && (
                  <div className="invalid-feedback">{errors.password}</div>
                )}
              </div>

              <div className="form-options">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={rememberMe}
                    onChange={(e) => {
                      const newRememberMe = e.target.checked;
                      setRememberMe(newRememberMe);

                      // If unchecking rememberMe, clear stored email from localStorage
                      if (!newRememberMe) {
                        localStorage.removeItem("rememberedEmail");
                        // Move email to sessionStorage for current session
                        if (email) {
                          sessionStorage.setItem("rememberedEmail", email);
                        }
                      }
                    }}
                  />
                  <label className="form-check-label">Remember Me</label>
                </div>
                <Link to="/forgot-password" className="forgot-link">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="spinner-border spinner-border-sm text-white" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : 'Login'}
              </button>

              <p className="resend-text" style={{ paddingTop: "20px" }}>
                Didn't have an Account?{" "}
                <Link to="/create-account">
                  <span className="resend-link">
                    Sign Up
                  </span>
                </Link>
              </p>
            </form>
          ) : (
            <div className="login-form">
              {/* 2FA Container with prominent styling */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                padding: '40px 20px',
                backgroundColor: getUIHints().backgroundColor || '#f8f9fa',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                marginTop: '20px',
              }}>
                {/* Message */}
                {twoFactorMessage && (
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '500',
                    color: '#212529',
                    textAlign: 'center',
                    marginBottom: '16px',
                    lineHeight: '1.5',
                    fontFamily: 'BasisGrotesquePro',
                    maxWidth: '500px',
                  }}>
                    {twoFactorMessage}
                  </div>
                )}

                {/* Instructions */}
                {twoFactorInstructions && (
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '400',
                    color: '#6B7280',
                    textAlign: 'center',
                    marginBottom: '30px',
                    lineHeight: '1.5',
                    fontFamily: 'BasisGrotesquePro',
                    maxWidth: '500px',
                  }}>
                    {twoFactorInstructions}
                  </div>
                )}

                {/* 2FA Code Input - Highly Visible */}
                <div style={{ width: '100%', maxWidth: '300px', margin: '0 auto 30px' }}>
                  <TwoFactorCodeInput
                    value={twoFactorCode}
                    onChange={(code) => {
                      setTwoFactorCode(code);
                      setTwoFactorError(null);
                    }}
                    onComplete={handleVerify2FA}
                    error={twoFactorError}
                    disabled={verifying2FA}
                    uiHints={getUIHints()}
                  />
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-2 justify-content-center" style={{ width: '100%', maxWidth: '300px' }}>
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="btn"
                    style={{
                      backgroundColor: "transparent",
                      color: "#3B4A66",
                      fontSize: "14px",
                      fontFamily: "BasisGrotesquePro",
                      border: "1px solid #E8F0FF",
                      padding: "10px 20px",
                      borderRadius: "6px",
                      flex: 1,
                    }}
                  >
                    Back to Login
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerify2FA(twoFactorCode)}
                    disabled={verifying2FA || twoFactorCode.length !== 6}
                    className="btn"
                    style={{
                      backgroundColor: "#F56D2D",
                      color: "#ffffff",
                      fontSize: "14px",
                      fontFamily: "BasisGrotesquePro",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "6px",
                      opacity: (verifying2FA || twoFactorCode.length !== 6) ? 0.6 : 1,
                      cursor: (verifying2FA || twoFactorCode.length !== 6) ? "not-allowed" : "pointer",
                      flex: 1,
                    }}
                  >
                    {verifying2FA ? 'Verifying...' : 'Verify & Login'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </FixedLayout>
  );
}


