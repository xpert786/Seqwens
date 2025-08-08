import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Forget.css";
import FixedLayout from "../components/FixedLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSendCode = () => {
    console.log("Sending reset code to:", email);
    navigate("/otp-verification");
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

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button className="btn send-btn" onClick={handleSendCode}>
              Send Code
            </button>
          </div>
        </div>
      </div>
    </FixedLayout>
  );
}
