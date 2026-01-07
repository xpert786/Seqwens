import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import "../styles/FirmSignup.css";
import FixedLayout from "../components/FixedLayout";
import { PasswordStrengthBar } from "../components/icons";
import { userAPI, validateEmail, validateFirmPhoneNumber, validatePassword, handleAPIError } from "../utils/apiUtils";
import { setTokens } from "../utils/userUtils";
import { getPathWithPrefix } from "../utils/urlUtils";

const FirmSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    password_confirm: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState('us');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-lowercase email
    const processedValue = name === 'email' ? value.toLowerCase() : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear general errors when any field changes
    if (errors.general) {
      setErrors(prev => ({
        ...prev,
        general: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // First name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.length > 100) {
      newErrors.first_name = 'First name must be 100 characters or less';
    }

    // Last name validation
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.length > 100) {
      newErrors.last_name = 'Last name must be 100 characters or less';
    }

    // Middle name validation (optional but check length if provided)
    if (formData.middle_name && formData.middle_name.length > 100) {
      newErrors.middle_name = 'Middle name must be 100 characters or less';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone number validation (optional)
    if (formData.phone_number && formData.phone_number.trim()) {
      const phoneValidation = validateFirmPhoneNumber(formData.phone_number);
      if (!phoneValidation.isValid) {
        newErrors.phone_number = phoneValidation.error;
      }
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordValidation.isValid) {
      newErrors.password = 'Password does not meet requirements';
    }

    // Confirm password validation
    if (!formData.password_confirm) {
      newErrors.password_confirm = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match';
    }

    // Terms and privacy validation
    if (!termsAccepted) {
      newErrors.terms = 'You must accept the Terms of Service';
    }

    if (!privacyAccepted) {
      newErrors.privacy = 'You must accept the Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const signupData = {
        first_name: formData.first_name.trim(),
        middle_name: formData.middle_name?.trim() || '',
        last_name: formData.last_name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone_number: formData.phone_number?.trim() || '',
        password: formData.password,
        password_confirm: formData.password_confirm
      };

      // Step 1: Create the firm account
      const signupResponse = await userAPI.signupFirm(signupData);

      // Step 2: Automatically log in the user
      try {
        const loginResponse = await userAPI.login({
          email: signupData.email,
          password: signupData.password
        });

        // Store tokens (use localStorage for remember me)
        setTokens(loginResponse.access_token, loginResponse.refresh_token, true);

        // Store user data
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userData", JSON.stringify(loginResponse.user));
        localStorage.setItem("userType", loginResponse.user.user_type || 'firm');
        localStorage.setItem("rememberedEmail", signupData.email);
        
        // Store firms data from login response for AccountSwitcher
        if (loginResponse.firms && Array.isArray(loginResponse.firms)) {
          localStorage.setItem("firmsData", JSON.stringify(loginResponse.firms));
        }

        // Get user info for routing
        const user = loginResponse.user;
        const userType = user.user_type;

        // Redirect to firm admin panel
        // Check if subscription plan needs to be finalized first
        if (userType === 'admin' || userType === 'firm') {
          // Check if 2FA is required but not enabled
          if (user.requires_2fa === false && user.two_factor_authentication === false) {
            navigate("/two-auth", { replace: true });
          } else if (user.subscription_plan === null || user.subscription_plan === undefined) {
            navigate("/firmadmin/finalize-subscription", { replace: true });
          } else {
            navigate("/firmadmin", { replace: true });
          }
        } else {
          // Fallback to firm admin if user type is unexpected
          navigate("/firmadmin", { replace: true });
        }
      } catch (loginError) {
        console.error('Auto-login error:', loginError);
        // If auto-login fails, redirect to login page with email pre-filled
        // Store message and email in localStorage since we're using window.location.href
        localStorage.setItem('signupSuccessMessage', 'Account created successfully! Please sign in.');
        localStorage.setItem('signupEmail', signupData.email);
        window.location.href = getPathWithPrefix('/login');
      }
    } catch (error) {
      console.error('Firm signup error:', error);
      
      const fieldErrors = {};

      // Try to extract structured errors from error.responseData (if available)
      if (error.responseData && error.responseData.errors) {
        // Direct access to structured errors
        Object.entries(error.responseData.errors).forEach(([field, errors]) => {
          // Map API field names to form field names (they're the same in this case)
          const errorMessages = Array.isArray(errors) ? errors : [errors];
          // Take the first error message for each field
          if (errorMessages.length > 0) {
            const errorMessage = typeof errorMessages[0] === 'string' 
              ? errorMessages[0] 
              : String(errorMessages[0]);
            fieldErrors[field] = errorMessage;
          }
        });
      } else if (error.message) {
        // Fallback: Parse error message string format "field: error1, error2; field2: error3"
        try {
          const errorParts = error.message.split(';');
          errorParts.forEach(part => {
            const colonIndex = part.indexOf(':');
            if (colonIndex > 0) {
              const field = part.substring(0, colonIndex).trim();
              const message = part.substring(colonIndex + 1).trim();
              
              // Map API field names to form field names
              const fieldMap = {
                'email': 'email',
                'password': 'password',
                'password_confirm': 'password_confirm',
                'first_name': 'first_name',
                'last_name': 'last_name',
                'middle_name': 'middle_name',
                'phone_number': 'phone_number'
              };

              if (fieldMap[field]) {
                // Clean up the message (remove array brackets, quotes, etc.)
                let cleanMessage = message
                  .replace(/^\[/, '')
                  .replace(/\]$/, '')
                  .replace(/^["']/, '')
                  .replace(/["']$/, '')
                  .trim();
                
                fieldErrors[fieldMap[field]] = cleanMessage;
              }
            }
          });
        } catch (parseError) {
          console.error('Error parsing field errors:', parseError);
        }
      }

      // If we have field-specific errors, use those; otherwise use general error
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        const errorMessage = handleAPIError(error);
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  // Password strength indicators
  const passwordValidation = validatePassword(formData.password);
  const validateLength = passwordValidation.minLength;
  const validateNumber = passwordValidation.hasNumber;
  const validateUpperLower = passwordValidation.hasUpperLower;
  const validateSpecialChar = passwordValidation.hasSpecialChar;

  return (
    <FixedLayout>
      <div className="firm-signup-wrapper">
        <div className="firm-signup-container">
          <h2 className="firm-signup-title">Create Your Firm Account</h2>
          <p className="firm-signup-subtitle">
            Register your firm and start managing your tax practice.
          </p>

          {errors.general && (
            <div className="alert alert-danger" role="alert">
              {errors.general}
            </div>
          )}

          <div className="form-wrapper">
            <form onSubmit={handleSubmit}>
              {/* First Name */}
              <div className="mb-3">
                <label className="custom-label">
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  className={`form-control custom-input ${errors.first_name ? 'is-invalid' : ''}`}
                  placeholder="Enter your first name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  maxLength={100}
                  onBlur={() => {
                    if (formData.first_name && !formData.first_name.trim()) {
                      setErrors(prev => ({ ...prev, first_name: 'First name is required' }));
                    }
                  }}
                />
                {errors.first_name && (
                  <div className="invalid-feedback">{errors.first_name}</div>
                )}
              </div>

              {/* Middle Name */}
              <div className="mb-3">
                <label className="custom-label">
                  Middle Name (Optional)
                </label>
                <input
                  type="text"
                  name="middle_name"
                  className={`form-control custom-input ${errors.middle_name ? 'is-invalid' : ''}`}
                  placeholder="Enter your middle name (optional)"
                  value={formData.middle_name}
                  onChange={handleInputChange}
                  maxLength={100}
                />
                {errors.middle_name && (
                  <div className="invalid-feedback">{errors.middle_name}</div>
                )}
              </div>

              {/* Last Name */}
              <div className="mb-3">
                <label className="custom-label">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  className={`form-control custom-input ${errors.last_name ? 'is-invalid' : ''}`}
                  placeholder="Enter your last name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  maxLength={100}
                  onBlur={() => {
                    if (formData.last_name && !formData.last_name.trim()) {
                      setErrors(prev => ({ ...prev, last_name: 'Last name is required' }));
                    }
                  }}
                />
                {errors.last_name && (
                  <div className="invalid-feedback">{errors.last_name}</div>
                )}
              </div>

              {/* Email */}
              <div className="mb-3">
                <label className="custom-label">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className={`form-control custom-input ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  maxLength={254}
                  onBlur={() => {
                    if (formData.email && !validateEmail(formData.email)) {
                      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
                    }
                  }}
                />
                <small className="form-text text-muted">
                  ℹ️ This will be your login email
                </small>
                {errors.email && (
                  <div className="invalid-feedback">{errors.email}</div>
                )}
              </div>

              {/* Phone Number */}
              <div className="mb-3">
                <label className="custom-label">  
                  Phone Number (Optional)test
                </label>
                <PhoneInput
                  country={phoneCountry}
                  value={formData.phone_number || ''}
                  onChange={(phone) => {
                    setFormData(prev => ({
                      ...prev,
                      phone_number: phone
                    }));
                    // Clear error when user starts typing
                    if (errors.phone_number) {
                      setErrors(prev => ({
                        ...prev,
                        phone_number: ''
                      }));
                    }
                  }}
                  onCountryChange={(countryCode) => {
                    setPhoneCountry(countryCode.toLowerCase());
                  }}
                  onBlur={() => {
                    if (formData.phone_number && formData.phone_number.trim()) {
                      const phoneValidation = validateFirmPhoneNumber(formData.phone_number);
                      if (!phoneValidation.isValid) {
                        setErrors(prev => ({
                          ...prev,
                          phone_number: phoneValidation.error
                        }));
                      }
                    }
                  }}
                  inputClass={`form-control ${errors.phone_number ? 'is-invalid' : ''}`}
                  containerClass="w-100 phone-input-container"
                  inputStyle={{
                    height: '45px',
                    paddingLeft: '48px',
                    paddingRight: '12px',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    width: '100%',
                    fontSize: '1rem',
                    border: errors.phone_number ? '1px solid #dc3545' : '1px solid #ced4da',
                    borderRadius: '0.375rem',
                    backgroundColor: '#fff'
                  }}
                  enableSearch={true}
                  countryCodeEditable={false}
                  placeholder="+1 (234) 567-8900"
                />
                <small className="form-text text-muted">
                  Format: +1234567890 or 987654123411
                </small>
                {errors.phone_number && (
                  <div className="invalid-feedback d-block" style={{
                    fontSize: "12px",
                    color: "#dc3545",
                    marginTop: "4px"
                  }}>
                    {errors.phone_number}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="mb-3">
                <label className="custom-label">
                  Password <span className="required">*</span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className={`custom-input ${errors.password ? 'is-invalid' : ''}`}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleInputChange}
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
                  <div className="invalid-feedback">{errors.password}</div>
                )}
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="password-strength mb-3">
                  <PasswordStrengthBar />
                  <div className="criteria">
                    <div className={`criteria-item ${validateLength ? "valid" : "invalid"}`}>
                      {validateLength ? "✔" : "✘"} 8+ characters
                    </div>
                    <div className={`criteria-item ${validateUpperLower ? "valid" : "invalid"}`}>
                      {validateUpperLower ? "✔" : "✘"} Uppercase and lowercase letters
                    </div>
                    <div className={`criteria-item ${validateNumber ? "valid" : "invalid"}`}>
                      {validateNumber ? "✔" : "✘"} Number
                    </div>
                    <div className={`criteria-item ${validateSpecialChar ? "valid" : "invalid"}`}>
                      {validateSpecialChar ? "✔" : "✘"} Special character
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <div className="mb-3">
                <label className="custom-label">
                  Confirm Password <span className="required">*</span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="password_confirm"
                    className={`custom-input ${errors.password_confirm ? 'is-invalid' : ''}`}
                    placeholder="Confirm your password"
                    value={formData.password_confirm}
                    onChange={handleInputChange}
                  />
                  <button
                    type="button"
                    className="toggle-visibility-btn"
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>
                {errors.password_confirm && (
                  <div className="invalid-feedback">{errors.password_confirm}</div>
                )}
              </div>

              {/* Terms and Privacy */}
              <div className="mb-3">
                <div className="form-check">
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
                      onClick={(e) => e.stopPropagation()}
                    >
                      Terms of Service
                    </a>
                    <span className="required">*</span>
                  </label>
                </div>
                {errors.terms && (
                  <div className="invalid-feedback">{errors.terms}</div>
                )}
              </div>

              <div className="mb-3">
                <div className="form-check">
                  <input
                    className={`form-check-input ${errors.privacy ? 'is-invalid' : ''}`}
                    type="checkbox"
                    id="privacyCheck"
                    checked={privacyAccepted}
                    onChange={(e) => {
                      setPrivacyAccepted(e.target.checked);
                      if (errors.privacy) {
                        setErrors(prev => ({ ...prev, privacy: '' }));
                      }
                    }}
                  />
                  <label className="form-check-label txts" htmlFor="privacyCheck">
                    I agree to the{" "}
                    <a
                      href="https://seqwens.com/privacy-policy/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="highlight"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Privacy Policy
                    </a>
                    <span className="required">*</span>
                  </label>
                </div>
                {errors.privacy && (
                  <div className="invalid-feedback">{errors.privacy}</div>
                )}
              </div>

              <button
                type="submit"
                className="btn create-firm-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Firm Account...' : 'Create Firm Account'}
              </button>
            </form>
          </div>

          <div className="signup-footer">
            <p>
              Already have an account?{" "}
              <Link to="/login" className="signin-link">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </FixedLayout>
  );
};

export default FirmSignup;

