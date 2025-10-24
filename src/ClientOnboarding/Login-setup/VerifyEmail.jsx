import { useState, useEffect } from "react";
import "../styles/VerifyPhone.css";
import FixedLayout from "../components/FixedLayout";
import { useNavigate } from "react-router-dom";
import { userAPI, handleAPIError } from "../utils/apiUtils";

export default function VerifyEmail() {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [showPopup, setShowPopup] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user email from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        setUserEmail(parsedUserData.email || '');
        
        // Check if email is already verified
        if (parsedUserData.is_email_verified) {
          console.log('Email is already verified, redirecting to dashboard');
          navigate("/dashboard");
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [navigate]);

  const handleChange = (value, index) => {
    if (/^[0-9]?$/.test(value)) {
      const updatedOtp = [...otp];
      updatedOtp[index] = value;
      setOtp(updatedOtp);
      if (value !== "" && index < 3) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);
    setErrors({});
    
    console.log('Sending email verification OTP for email:', userEmail);
    
    try {
      const response = await userAPI.sendEmailVerificationOtp(userEmail);
      console.log('Send OTP response:', response);
      
      if (response.success) {
        setOtpSent(true);
        setErrors({});
        console.log('OTP sent successfully');
      } else {
        console.error('OTP send failed:', response);
        setErrors({ 
          general: response.message || "Failed to send OTP" 
        });
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      setErrors({ 
        general: handleAPIError(error) 
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerify = async () => {
    const enteredOtp = otp.join("");
    
    // Validate OTP
    if (enteredOtp.length !== 4) {
      setErrors({ otp: 'Please enter the complete 4-digit OTP' });
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await userAPI.verifyEmailOtp(enteredOtp);
      
      // Show success popup
      setShowPopup(true);
    } catch (error) {
      console.error('Email verification error:', error);
      setErrors({ 
        general: handleAPIError(error) 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <FixedLayout>
      <div className="verify-page">
        <div className="otp-box">
          <h5 className="otp-title">VERIFY YOUR EMAIL</h5>
          
          {!otpSent ? (
            <>
              <p className="otp-subtext">
                Click the button below to send a verification code to<br />
                <span className="highlight">{userEmail}</span>.
              </p>

              {errors.general && (
                <div className="alert alert-danger" role="alert">
                  {errors.general}
                </div>
              )}

              <button 
                onClick={handleSendOtp} 
                className="verify-btn"
                disabled={sendingOtp}
              >
                {sendingOtp ? 'Sending OTP...' : 'Send Verification Code'}
              </button>
            </>
          ) : (
            <>
              <p className="otp-subtext">
                A verification code has been sent to<br />
                <span className="highlight">{userEmail}</span>.
                Please check your email and enter the code below to activate your account.
              </p>

              {errors.general && (
                <div className="alert alert-danger" role="alert">
                  {errors.general}
                </div>
              )}

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
                  />
                ))}
              </div>

              <button 
                onClick={handleVerify} 
                className="verify-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <p className="resend-text">
                Didn't receive the code?{" "}
                <span className="resend-link" onClick={handleSendOtp}>
                  Resend Code
                </span>
              </p>
            </>
          )}
        </div>

        {showPopup && (
          <div className="popup-overlay">
            <div className="popup">
              <div className="success-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="#fff"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20.285 6.709a1 1 0 00-1.414-1.418L9 15.162l-3.879-3.88a1 1 0 00-1.414 1.415l4.586 4.586a1 1 0 001.414 0l10.578-10.574z" />
                </svg>
              </div>
              <h5 className="popup-title">VERIFIED SUCCESSFULLY</h5>
              <p className="popup-message">
               Congratulations! your account <br />
                <span className="highlight">{userEmail}</span> has been verified.
              </p>
              <button onClick={handleGoToDashboard} className="dashboard-btn">
                Go To Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </FixedLayout>
  );
}
