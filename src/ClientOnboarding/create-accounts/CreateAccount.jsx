import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CreateAccount.css";
import FixedLayout from "../components/FixedLayout";
import { userAPI, validateEmail, validatePhoneNumber, handleAPIError } from "../utils/apiUtils";

const CreateAccount = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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
          <h2 className="create-account-title">Create Your Account</h2>
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
                  <label className="custom-label">Middle Initial</label>
                  <input
                    type="text"
                    name="middleName"
                    className="form-control custom-input"
                    placeholder="Enter middle initial"
                    value={formData.middleName}
                    onChange={handleInputChange}
                  />
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
                <input
                  type="tel"
                  name="phoneNumber"
                  className={`form-control custom-input ${errors.phoneNumber ? 'is-invalid' : ''}`}
                  placeholder="+01"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
                {errors.phoneNumber && (
                  <div className="invalid-feedback">{errors.phoneNumber}</div>
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