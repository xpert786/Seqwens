import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneInput from 'react-phone-input-2';
import "../styles/CreateAccount.css";
import FixedLayout from "../components/FixedLayout";
import { userAPI, validateEmail, validatePhoneNumber, handleAPIError } from "../utils/apiUtils";

const CreateAccount = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '+1'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState('us');
  const [phoneCountrySelected, setPhoneCountrySelected] = useState(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Store user data for the next step (password page)
    localStorage.setItem('userRegistrationData', JSON.stringify(formData));

    // Navigate to personal info page
    navigate('/personal-info');
  };
  return (
    <FixedLayout>
      <div className="create-account-wrapper">
        <div className="create-account-container">
          <h3 className="create-account-title">Create Your Account</h3>
          <p className="create-account-subtitle">
            Start your return by creating a secure account.
          </p>

          {errors.general && (
            <div className="alert alert-danger" role="alert">
              {errors.general}
            </div>
          )}

          <div className="form-wrapper">
            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col">
                  <label className="custom-label">
                    First Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    className={`form-control custom-input ${errors.firstName ? 'is-invalid' : ''}`}
                    placeholder="Enter Your First Name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                  {errors.firstName && (
                    <div className="invalid-feedback">{errors.firstName}</div>
                  )}
                </div>
                <div className="col">
                  <label className="custom-label">
                    Last Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    className={`form-control custom-input ${errors.lastName ? 'is-invalid' : ''}`}
                    placeholder="Enter Your Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                  {errors.lastName && (
                    <div className="invalid-feedback">{errors.lastName}</div>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <label className="custom-label">
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className={`form-control custom-input ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="abc@gmail.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                {errors.email && (
                  <div className="invalid-feedback">{errors.email}</div>
                )}
              </div>

              <div className="mb-4">
                <label className="custom-label">
                  Phone Number <span className="required">*</span>
                </label>
                <PhoneInput
                  country={phoneCountry}
                  value={formData.phoneNumber || ''}
                  onChange={(phone) => {
                    // Always allow the change - let the library handle it
                    setFormData(prev => ({
                      ...prev,
                      phoneNumber: phone
                    }));
                    // Clear error when user starts typing
                    if (errors.phoneNumber) {
                      setErrors(prev => ({
                        ...prev,
                        phoneNumber: ''
                      }));
                    }
                  }}
                  onCountryChange={(countryCode, countryData) => {
                    setPhoneCountry(countryCode.toLowerCase());
                    setPhoneCountrySelected(true);
                    // When country is selected, insert the dial code
                    setFormData(prev => ({
                      ...prev,
                      phoneNumber: `+${countryData.dialCode}`
                    }));
                  }}
                  onFocus={() => {
                    // If field is empty and country not selected, ensure we have a default
                    if (!formData.phoneNumber && !phoneCountrySelected) {
                      // Keep empty, user must select country first
                    }
                  }}
                  onBlur={() => {
                    // Validate on blur if phone number is entered but invalid
                    if (formData.phoneNumber && formData.phoneNumber.trim()) {
                      const digitsOnly = formData.phoneNumber.replace(/\D/g, '');
                      if (digitsOnly.length < 10) {
                        setErrors(prev => ({
                          ...prev,
                          phoneNumber: 'Please enter a valid phone number (at least 10 digits)'
                        }));
                      }
                    }
                  }}
                  inputClass={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                  containerClass="w-100 phone-input-container"
                  inputStyle={{
                    height: '45px',
                    paddingLeft: '48px',
                    paddingRight: '12px',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    width: '100%',
                    fontSize: '1rem',
                    border: errors.phoneNumber ? '1px solid #dc3545' : '1px solid #ced4da',
                    borderRadius: '0.375rem',
                    backgroundColor: '#fff'
                  }}
                  enableSearch={true}
                  countryCodeEditable={false}
                  disabled={false}
                  specialLabel=""
                />
                {errors.phoneNumber && (
                  <div className="invalid-feedback d-block" style={{
                    fontSize: "12px",
                    color: "#dc3545",
                    marginTop: "4px"
                  }}>
                    {errors.phoneNumber}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn continue-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Continue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </FixedLayout>
  );
};

export default CreateAccount;