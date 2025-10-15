import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Otpveri.css";
import FixedLayout from "../components/FixedLayout";

export default function OtpVerification() {
  const [otp, setOtp] = useState(["", "", "", ""]);
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
              <span className="highlighted-email">john@gmail.com</span>.
              <br />
              Please check your email and enter the code below to activate your account.
            </p>
          </div>

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

          <button onClick={handleVerify} className="otp-btn">
            Verify OTP
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
