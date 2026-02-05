import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PersonalInfo.css";
import { PasswordStrengthBar } from "../components/icons";
import FixedLayout from "../components/FixedLayout";
import { userAPI, validatePassword, handleAPIError } from "../utils/apiUtils";
import { setTokens } from "../utils/userUtils";
import { getPathWithPrefix, getLoginUrl } from "../utils/urlUtils";

const PersonalInfo = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

      // Step 2: Automatically log in the user
      try {
        const loginResponse = await userAPI.login({
          email: completeUserData.email,
          password: completeUserData.password
        });

        // Store tokens
        const accessToken = loginResponse.access_token || loginResponse.data?.access;
        const refreshToken = loginResponse.refresh_token || loginResponse.data?.refresh;
        setTokens(accessToken, refreshToken, true);

        // Store user data
        localStorage.setItem("isLoggedIn", "true");
        const user = loginResponse.user || loginResponse.data?.user;
        localStorage.setItem("userData", JSON.stringify(user));
        localStorage.setItem("userType", user.user_type || 'firm');
        localStorage.setItem("rememberedEmail", completeUserData.email);

        // Store firms data from login response for AccountSwitcher
        const firms = loginResponse.firms || loginResponse.data?.firms;
        if (firms && Array.isArray(firms)) {
          localStorage.setItem("firmsData", JSON.stringify(firms));
        }

        const userType = user.user_type;

        // Redirect based on user type
        if (userType === 'admin' || userType === 'firm') {
          if (user.subscription_plan === null || user.subscription_plan === undefined) {
            navigate("/firmadmin/finalize-subscription", { replace: true });
          } else {
            navigate("/firmadmin", { replace: true });
          }
        } else if (userType === 'tax_preparer') {
          navigate("/taxdashboard", { replace: true });
        } else {
          // Check completion status for clients
          if (user.is_completed) {
            navigate("/dashboard", { replace: true });
          } else {
            navigate("/dashboard-first", { replace: true });
          }
        }
      } catch (loginError) {
        console.error('Auto-login error:', loginError);
        // Fallback to manual login
        window.location.href = getLoginUrl();
      }
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
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

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
                      className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"
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
                <PasswordStrengthBar
                  v1={validateLength}
                  v2={validateNumber}
                  v3={validateUpperLower}
                  v4={validateSpecialChar}
                />
                <div className="criteria">
                  <div
                    className={`criteria-item ${validateLength ? "valid" : "invalid"
                      }`}
                  >
                    {validateLength ? "✔" : "✘"} At Least 8 Characters
                  </div>
                  <div
                    className={`criteria-item ${validateNumber ? "valid" : "invalid"
                      }`}
                  >
                    {validateNumber ? "✔" : "✘"} At least one number
                  </div>
                  <div
                    className={`criteria-item ${validateUpperLower ? "valid" : "invalid"
                      }`}
                  >
                    {validateUpperLower ? "✔" : "✘"} Uppercase/Lowercase letter
                  </div>
                  <div
                    className={`criteria-item ${validateSpecialChar ? "valid" : "invalid"
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
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
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
                  <button
                    type="button"
                    className="toggle-visibility-btn"
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    <i
                      className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"
                        }`}
                    ></i>
                  </button>
                </div>
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
                  <a
                    href="https://seqwens.com/terms-of-service/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="highlight"
                    style={{ color: '#F49C2D', cursor: 'pointer', textDecoration: 'none' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms of Use
                  </a>{" "}
                  &{" "}
                  <a
                    href="https://seqwens.com/privacy-policy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="highlight"
                    style={{ color: '#F49C2D', cursor: 'pointer', textDecoration: 'none' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Privacy Policy
                  </a>.
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
            disabled={isLoading || !termsAccepted}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

        </div>
      </div>
    </FixedLayout>
  );
};

export default PersonalInfo;
