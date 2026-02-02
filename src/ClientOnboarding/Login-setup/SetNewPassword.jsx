import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/SetNewPassword.css";
import { PasswordStrengthBar } from "../components/icons";
import FixedLayout from "../components/FixedLayout";
import { userAPI, validatePassword, handleAPIError } from "../utils/apiUtils";
import { navigateToLogin } from "../utils/urlUtils";

export default function SetNewPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [password, setPassword] = useState('');
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
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setErrors({ password: 'Password does not meet requirements' });
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
          <h5 className="password-title">SET NEW PASSWORD</h5>
          <p className="password-subtitle">
            Use at least 8 characters with a mix of uppercase, lowercase, numbers, and special characters.
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors(prev => ({ ...prev, password: '' }));
                  }
                }}
              />
              <button
                type="button"
                className="toggle-visibility-btn mt-2"
                onClick={togglePasswordVisibility}
              >
                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
            </div>
            {errors.password && (
              <div className="invalid-feedback">{errors.password}</div>
            )}

            <div className="password-strength-box">
              <div className="d-flex align-items-start mb-2">
                <PasswordStrengthBar
                  v1={validateLength}
                  v2={validateNumber}
                  v3={validateUpperLower}
                  v4={validateSpecialChar}
                />
              </div>
              <div className="d-flex flex-wrap gap-4 mb-2 password-criteria">
                <div className={`small ${validateLength ? 'text-success' : 'text-danger'}`}>
                  {validateLength ? '✔' : '✘'} At least 8 characters
                </div>
                <div className={`small ${validateNumber ? 'text-success' : 'text-danger'}`}>
                  {validateNumber ? '✔' : '✘'} At least one number
                </div>
                <div className={`small ${validateUpperLower ? 'text-success' : 'text-danger'}`}>
                  {validateUpperLower ? '✔' : '✘'} Uppercase/Lowercase letter
                </div>
                <div className={`small ${validateSpecialChar ? 'text-success' : 'text-danger'}`}>
                  {validateSpecialChar ? '✔' : '✘'} At least one special character
                </div>
              </div>
            </div>
          </div>

          <label className="password-label">Confirm Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) {
                setErrors(prev => ({ ...prev, confirmPassword: '' }));
              }
            }}
            className={`form-control confirm-password-input ${errors.confirmPassword ? 'is-invalid' : ''}`}
          />
          {errors.confirmPassword && (
            <div className="invalid-feedback">{errors.confirmPassword}</div>
          )}

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
