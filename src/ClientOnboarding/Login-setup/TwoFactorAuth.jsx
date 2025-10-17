import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/TwoAuth.css";
import { EmailIcon, PhoneIcon } from "../components/icons";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import FixedLayout from "../components/FixedLayout";

export default function TwoFactorAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already verified and redirect accordingly
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const isEmailVerified = user.is_email_verified;
        const isPhoneVerified = user.is_phone_verified;
        
        console.log('TwoFactorAuth - User verification status:', { isEmailVerified, isPhoneVerified });
        
        // If either email or phone is verified, redirect to dashboard
        if (isEmailVerified || isPhoneVerified) {
          console.log('User is already verified, redirecting to dashboard');
          navigate("/dashboard");
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [navigate]);

  return (
    <FixedLayout>
      <div className="twofa-container">
        <div className="twofa-boxs">
          <div className="twofa-content">
            <div className="twofa-header">
              <h5>SECURE YOUR ACCOUNT WITH 2FA</h5>
              <p>
                Two-Factor Authentication adds an extra security layer,
                protecting your account with a code and password.
              </p>
            </div>

            <div className="twofa-options">
              {/* EMAIL OPTION */}
              <button
                className="twofa-btn"
                onClick={() => navigate("/verify-email")}
              >
                <div className="twofa-btn-left">
                  <div className="twofa-icon">
                    <EmailIcon style={{ color: "#00C2CB" }} />
                  </div>
                  <div className="twofa-text">
                    <div className="twofa-title">EMAIL</div>
                    <div className="twofa-desc">
                      We’ll send a verification code to your email address.
                    </div>
                  </div>
                </div>
                <ArrowForwardIosIcon className="arrow-icon" />
              </button>

              {/* PHONE OPTION */}
              <button
                className="twofa-btn"
                onClick={() => navigate("/verify-phone")}
              >
                <div className="twofa-btn-left">
                  <div className="twofa-icon">
                    <PhoneIcon style={{ color: "#00C2CB" }} />
                  </div>
                  <div className="twofa-text">
                    <div className="twofa-title">PHONE</div>
                    <div className="twofa-desc">
                      We’ll send an SMS with a verification code to your phone.
                    </div>
                  </div>
                </div>
                <ArrowForwardIosIcon className="arrow-icon" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </FixedLayout>
  );
}
