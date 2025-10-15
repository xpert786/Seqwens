import { useState } from "react";
import "../styles/VerifyPhone.css";
import FixedLayout from "../components/FixedLayout";
import { useNavigate } from "react-router-dom";

export default function VerifyPhone() {
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
      <div className="verify-page">
        <div className="otp-box">
          <h5 className="otp-title">VERIFY YOUR PHONE</h5>
          <p className="otp-subtext">
            A verification code has been sent to <br />
            <span className="highlight">+1 ******3960</span>.
            Please check your SMS and enter the code below to activate your account.
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
              />
            ))}
          </div>

          <button onClick={handleVerify} className="verify-btn">
            Verify OTP
          </button>

          <p className="resend-text">
            Didn’t receive the code?{" "}
            <span className="resend-link">Resend Code</span>
          </p>
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
                Congratulations! Your phone number <br />
                <span className="highlight">+1-234-567-8901</span> has been verified.
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
