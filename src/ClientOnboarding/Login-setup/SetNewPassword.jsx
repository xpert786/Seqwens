import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/SetNewPassword.css";
import { PasswordStrengthBar } from "../components/icons";
import FixedLayout from "../components/FixedLayout";
import { userAPI, validatePassword, handleAPIError } from "../utils/apiUtils";
import { navigateToLogin } from "../utils/urlUtils";

export default function SetNewPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [password, setPassword] = useState('');
  const [hasTyped, setHasTyped] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isForced, setIsForced] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for forced password reset from login
    if (location.state?.forced && location.state?.email && location.state?.tempPassword) {
      setEmail(location.state.email);
      setTempPassword(location.state.tempPassword);
      setIsForced(true);
      return;
    }

    // Get email and OTP from localStorage
    const storedEmail = localStorage.getItem('resetEmail');
    const storedOtp = localStorage.getItem('resetOtp');

    if (!storedEmail || !storedOtp) {
      // If no email or OTP, redirect back to forgot password
      navigate('/forgot-password');
      return;
    }

    setEmail(storedEmail);
    setOtp(storedOtp);
  }, [navigate, location]);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const handleResetPassword = async () => {
    // Clear previous errors
    setErrors({});

    // Validate passwords
    if (!password.trim()) {
      setErrors({ password: 'Password is required' });
      return;
    }

    if (!confirmPassword.trim()) {
      setErrors({ confirmPassword: 'Please confirm your password' });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: '⚠️ Passwords do not match.' });
      return;
    }

    const getFirstMissingRequirement = () => {
      if (!validateLength) return "Password must be at least 8 characters.";
      if (!validateUpperLower) return "Password must include both uppercase and lowercase letters.";
      if (!validateNumber) return "Password must include at least one number.";
      if (!validateSpecialChar) return "Password must include at least one special character.";
      return null;
    };

    const missingRequirement = getFirstMissingRequirement();
    if (missingRequirement) {
      setErrors({ password: `⚠️ ${missingRequirement}` });
      return;
    }

    setIsLoading(true);

    try {
      if (isForced) {
        await userAPI.forceChangePassword(email, tempPassword, password, confirmPassword);
        // Navigate to login with success message
        navigate('/login', { state: { message: "Password updated successfully. Please login with your new password." } });
      } else {
        const response = await userAPI.verifyOtpAndResetPassword(email, otp, password, confirmPassword);

        // Clear stored data
        localStorage.removeItem('resetEmail');
        localStorage.removeItem('resetOtp');

        // Navigate to login page using conditional URL
        navigateToLogin(navigate);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setErrors({
        general: handleAPIError(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateLength = password.length >= 8;
  const validateNumber = /\d/.test(password);
  const validateUpperLower = /(?=.*[a-z])(?=.*[A-Z])/.test(password);
  const validateSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    <FixedLayout>
      <div className="set-password-wrapper">
        <div className="set-password-box">
          <h5 className="password-title">Set Your Password</h5>
          <p className="password-subtitle">
            Choose a strong password to protect your account.
          </p>

          {errors.general && (
            <div className="alert alert-danger" role="alert">
              {errors.general}
            </div>
          )}

          <div className="mb-2">
            <label className="password-label">New Password</label>
            <div className="input-group custom-input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-control custom-input ${errors.password ? 'is-invalid' : ''}`}
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (!hasTyped && e.target.value) setHasTyped(true);
                  if (errors.password) {
                    setErrors(prev => ({ ...prev, password: '' }));
                  }
                }}
              />
              <button
                type="button"
                className="toggle-visibility-btn"
                onClick={togglePasswordVisibility}
              >
                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
            </div>
            {errors.password && (
              <div className="invalid-feedback d-block text-danger mt-2">{errors.password}</div>
            )}

            <div className="password-strength-box">
              <div className="password-strength-label mb-2">Password Strength:</div>
              <div className="d-flex align-items-start mb-3">
                <PasswordStrengthBar
                  v1={hasTyped && validateLength}
                  v2={hasTyped && validateNumber}
                  v3={hasTyped && validateUpperLower}
                  v4={hasTyped && validateSpecialChar}
                  inactiveColor="#D1D5DB"
                />
              </div>
              <div className="d-flex flex-column gap-2 password-criteria">
                <div className={`small d-flex align-items-center gap-2 ${hasTyped && validateLength ? 'text-success' : ''}`} style={{ color: hasTyped && validateLength ? '#22C55E' : '#6B7280' }}>
                  {hasTyped && validateLength ? '✔' : '•'} At least 8 characters
                </div>
                <div className={`small d-flex align-items-center gap-2 ${hasTyped && validateUpperLower ? 'text-success' : ''}`} style={{ color: hasTyped && validateUpperLower ? '#22C55E' : '#6B7280' }}>
                  {hasTyped && validateUpperLower ? '✔' : '•'} One uppercase and one lowercase letter
                </div>
                <div className={`small d-flex align-items-center gap-2 ${hasTyped && validateNumber ? 'text-success' : ''}`} style={{ color: hasTyped && validateNumber ? '#22C55E' : '#6B7280' }}>
                  {hasTyped && validateNumber ? '✔' : '•'} One number
                </div>
                <div className={`small d-flex align-items-center gap-2 ${hasTyped && validateSpecialChar ? 'text-success' : ''}`} style={{ color: hasTyped && validateSpecialChar ? '#22C55E' : '#6B7280' }}>
                  {hasTyped && validateSpecialChar ? '✔' : '•'} One special character
                </div>
              </div>
            </div>
          </div>

          <label className="password-label">Confirm Password</label>
          <div className="input-group custom-input-group">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) {
                  setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }
              }}
              className={`form-control custom-input ${errors.confirmPassword ? "is-invalid" : ""}`}
            />
            <button
              type="button"
              className="toggle-visibility-btn"
              onClick={toggleConfirmPasswordVisibility}
            >
              <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
            </button>
          </div>
          {errors.confirmPassword && <div className="invalid-feedback d-block text-danger mt-2">{errors.confirmPassword}</div>}

          <button
            className="reset-button"
            onClick={handleResetPassword}
            disabled={isLoading}
          >
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </div>
      </div>
    </FixedLayout>
  );
}
