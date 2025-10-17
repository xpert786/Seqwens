import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PersonalInfo.css";
import { PasswordStrengthBar } from "../components/icons";
import FixedLayout from "../components/FixedLayout";
import { userAPI, validatePassword, handleAPIError } from "../utils/apiUtils";

const PersonalInfo = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage
    const storedData = localStorage.getItem('userRegistrationData');
    if (!storedData) {
      // If no user data, redirect back to create account
      navigate('/create-account');
      return;
    }
    
    try {
      setUserData(JSON.parse(storedData));
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/create-account');
    }
  }, [navigate]);

  const handleCreateAccount = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Complete the registration with all data including password
      const completeUserData = {
        ...userData,
        password,
        passwordConfirm: confirmPassword
      };

      
      const response = await userAPI.registerUser(completeUserData);

      // Clear stored registration data
      localStorage.removeItem('userRegistrationData');
      
      // Set login status and navigate
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userData", JSON.stringify(response));
      
      navigate("/dataintake");
    } catch (error) {
      console.error('Registration completion error:', error);
      setErrors({ 
        general: handleAPIError(error) 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const passwordValidation = validatePassword(password);

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!passwordValidation.isValid) {
      newErrors.password = 'Password does not meet requirements';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!termsAccepted) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const validateLength = password.length >= 8;
  const validateNumber = /\d/.test(password);
  const validateUpperLower = /(?=.*[a-z])(?=.*[A-Z])/.test(password);
  const validateSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!userData) {
    return (
      <FixedLayout>
        <div className="personal-info-wrapper">
          <div className="personal-info-container">
            <div className="text-center">
              <p>Loading...</p>
            </div>
          </div>
        </div>
      </FixedLayout>
    );
  }

  return (
    <FixedLayout>
      <div className="personal-info-wrapper">
        <div className="personal-info-container">
          <h2 className="personal-info-title">Create Your Password</h2>
          <p className="personal-info-subtitle">
            Let's finish setting up your account by creating a password
          </p>

          {errors.general && (
            <div className="alert alert-danger" role="alert">
              {errors.general}
            </div>
          )}

          <div className="form-wrapper">
            <form>
              {/* New Password */}
              <div className="mb-3">
                <label className="custom-label">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`custom-input ${errors.password ? 'is-invalid' : ''}`}
                    placeholder="Enter Your Password"
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
                {errors.password && (
                  <div className="invalid-feedback">{errors.password}</div>
                )}
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
                  className={`custom-input ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  placeholder="Enter Your Password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                />
                {errors.confirmPassword && (
                  <div className="invalid-feedback">{errors.confirmPassword}</div>
                )}
              </div>

              {/* Terms */}
              <div className="form-check mb-3">
                <input
                  className={`form-check-input ${errors.terms ? 'is-invalid' : ''}`}
                  type="checkbox"
                  id="termsCheck"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (errors.terms) {
                      setErrors(prev => ({ ...prev, terms: '' }));
                    }
                  }}
                />
                <label className="form-check-label txts" htmlFor="termsCheck">
                  I agree to the{" "}
                  <span className="highlight">Terms of Use</span> &{" "}
                  <span className="highlight">Privacy Policy</span>.
                </label>
                {errors.terms && (
                  <div className="invalid-feedback">{errors.terms}</div>
                )}
              </div>
            </form>
          </div>

          <button
            type="button"
            className="create-account-btn"
            onClick={handleCreateAccount}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      </div>
    </FixedLayout>
  );
};

export default PersonalInfo;
