import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Forget.css";
import FixedLayout from "../components/FixedLayout";
import { userAPI, validateEmail, handleAPIError } from "../utils/apiUtils";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async () => {
    // Clear previous errors
    setErrors({});

    // Validate email
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await userAPI.forgotPassword(email);

      // Store email for OTP verification page
      localStorage.setItem('resetEmail', email);

      // Navigate to OTP verification
      navigate("/otp-verification");
    } catch (error) {
      console.error('Forgot password error:', error);
      setErrors({
        general: handleAPIError(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FixedLayout>
      <div className="forgot-password-page">
        <div className="forgot-box">
          <div>
            <div className="forgot-header">
              <h5 className="forgot-title">FORGOT PASSWORD ?</h5>
              <p className="forgot-subtitle">
                Please enter your valid email account to send the verification code to reset your password.
              </p>
            </div>

            {errors.general && (
              <div className="alert alert-danger" role="alert">
                {errors.general}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                id="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="Enter your email"
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

            <button
              className="btn send-btn"
              onClick={handleSendCode}
              disabled={isLoading}
            >
              {isLoading ? 'Sending Code...' : 'Send Code'}
            </button>
          </div>
        </div>
      </div>
    </FixedLayout>
  );
}




