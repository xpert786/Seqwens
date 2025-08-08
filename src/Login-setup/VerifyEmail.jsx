import { useState } from "react";
import "../styles/VerifyEmail.css";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import FixedLayout from "../components/FixedLayout";

export default function VerifyEmail() {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

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

  const handleVerify = () => {
    const enteredOtp = otp.join("");
    console.log("Verifying OTP:", enteredOtp);
    setShowPopup(true);
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <FixedLayout>
      <div className="verify-container">
        <div className="otp-box">
          <h5 className="otp-title">VERIFY YOUR EMAIL</h5>
          <p className="otp-subtitle">
            A verification code has been sent to{" "}
            <span className="highlight">john@gmail.com</span>.<br />
            Please check your email and enter the code below to activate your account.
          </p>

          <div className="otp-inputs">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                className="otp-input"
              />
            ))}
          </div>

          <button className="verify-btn" onClick={handleVerify}>
            Verify OTP
          </button>

          <p className="resend-text">
            Didn’t receive the code?{" "}
            <span className="resend-link">Resend Code</span>
          </p>
        </div>

        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              <FaCheckCircle className="popup-icon" />
              <h4 className="popup-title">VERIFIED SUCCESSFULLY</h4>
              <p className="popup-desc">
                Congratulations! your account{" "}
                <span className="highlight">john@gmail.com</span> has been verified.
              </p>
              <button className="goto-dashboard-btn" onClick={handleGoToDashboard}>
                Go To Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </FixedLayout>
  );
}
