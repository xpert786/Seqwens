import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PersonalInfo.css";
import { PasswordStrengthBar } from "../components/icons";
import FixedLayout from "../components/FixedLayout";

const PersonalInfo = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    localStorage.setItem("isLoggedIn", "true");
    navigate("/dataintake");
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const validateLength = password.length >= 8;
  const validateNumber = /\d/.test(password);
  const validateUpperLower = /(?=.*[a-z])(?=.*[A-Z])/.test(password);
  const validateSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    <FixedLayout>
      <div className="personal-info-wrapper">
        <div className="personal-info-container">
          <h2 className="personal-info-title">Create Your Password</h2>
          <p className="personal-info-subtitle">
            Let's finish setting up your account by creating a password
          </p>

          <div className="form-wrapper">
            <form>
              {/* New Password */}
              <div className="mb-3">
                <label className="custom-label">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="custom-input"
                    placeholder="Enter Your Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="toggle-visibility-btn"
                    onClick={togglePasswordVisibility}
                  >
                    <i
                      className={`bi ${
                        showPassword ? "bi-eye-slash" : "bi-eye"
                      }`}
                    ></i>
                  </button>
                </div>
              </div>

              {/* Strength Meter */}
              <div className="password-strength">
                <PasswordStrengthBar />
                <div className="criteria">
                  <div
                    className={`criteria-item ${
                      validateLength ? "valid" : "invalid"
                    }`}
                  >
                    {validateLength ? "✔" : "✘"} At Least 8 Characters
                  </div>
                  <div
                    className={`criteria-item ${
                      validateNumber ? "valid" : "invalid"
                    }`}
                  >
                    {validateNumber ? "✔" : "✘"} At least one number
                  </div>
                  <div
                    className={`criteria-item ${
                      validateUpperLower ? "valid" : "invalid"
                    }`}
                  >
                    {validateUpperLower ? "✔" : "✘"} Uppercase/Lowercase letter
                  </div>
                  <div
                    className={`criteria-item ${
                      validateSpecialChar ? "valid" : "invalid"
                    }`}
                  >
                    {validateSpecialChar ? "✔" : "✘"} At least one special
                    character
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="mb-3">
                <label className="custom-label">Confirm Password</label>
                <input
                  type="password"
                  className="custom-input"
                  placeholder="Enter Your Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {/* Terms */}
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="termsCheck"
                />
                <label className="form-check-label txts" htmlFor="termsCheck">
                  I agree to the{" "}
                  <span className="highlight">Terms of Use</span> &{" "}
                  <span className="highlight">Privacy Policy</span>.
                </label>
              </div>
            </form>
          </div>

          <button
            type="button"
            className="create-account-btn"
            onClick={handleCreateAccount}
          >
            Create Account
          </button>
        </div>
      </div>
    </FixedLayout>
  );
};

export default PersonalInfo;
