import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Otpveri.css";
import FixedLayout from "../components/FixedLayout";

export default function OtpVerification() {
  const [otp, setOtp] = useState(["", "", "", ""]); // 4-digit OTP
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get email from localStorage
    const storedEmail = localStorage.getItem('resetEmail');
    if (!storedEmail) {
      // If no email, redirect back to forgot password
      navigate('/forgot-password');
      return;
    }
    setEmail(storedEmail);
  }, [navigate]);

  const handleChange = (value, index) => {
    if (/^[0-9]?$/.test(value)) {
      const updatedOtp = [...otp];
      updatedOtp[index] = value;
      setOtp(updatedOtp);
      if (value !== "" && index < 3) { // 4-digit OTP (0-3)
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  const handleVerify = () => {
    const enteredOtp = otp.join("");
    
    // Validate OTP
    if (enteredOtp.length !== 4) {
      setErrors({ otp: 'Please enter the complete 4-digit OTP' });
      return;
    }

    // Store OTP for the next step
    localStorage.setItem('resetOtp', enteredOtp);
    
    // Navigate to set new password
    navigate("/set-new-password");
  };

  return (
    <FixedLayout>
      <div className="otp-page">
        <div className="otp-box">
          <div className="otp-header">
            <h5 className="otp-title">OTP VERIFICATION</h5>
            <p className="otp-description">
              A verification code has been sent to{" "}
              <span className="highlighted-email">{email}</span>.
              <br />
              Please check your email and enter the 4-digit code below.
            </p>
          </div>

          {errors.otp && (
            <div className="alert alert-danger" role="alert">
              {errors.otp}
            </div>
          )}

          <div className="otp-inputs">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                className="otp-digit"
              />
            ))}
          </div>

          <button 
            onClick={handleVerify} 
            className="otp-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <p className="resend-info">
            Didn’t receive the code?{" "}
            <span className="resend-link">Resend Code</span>
          </p>
        </div>
      </div>
    </FixedLayout>
  );
}
