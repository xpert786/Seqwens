import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SetNewPassword.css";
import { PasswordStrengthBar } from "../components/icons";
import FixedLayout from "../components/FixedLayout";

export default function SetNewPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleResetPassword = () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    console.log("Password reset to:", password);
  
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

          <div className="mb-2">
            <label className="password-label">New Password</label>
            <div className="input-group custom-input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control custom-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                
              />
               <button
                    type="button"
                    className="toggle-visibility-btn mt-2"
                    onClick={togglePasswordVisibility}
                  >
                    <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
            </div>

            <div className="password-strength-box">
              <div className="d-flex align-items-start mb-2">
                <PasswordStrengthBar />
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
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="form-control confirm-password-input"
          />

          <button className="reset-button" onClick={handleResetPassword}>
            Reset Password
          </button>
        </div>
      </div>
    </FixedLayout>
  );
}
