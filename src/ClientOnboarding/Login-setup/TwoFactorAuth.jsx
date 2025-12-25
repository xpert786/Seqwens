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
    // Check both localStorage and sessionStorage
    let userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const userType = localStorage.getItem('userType') || sessionStorage.getItem('userType');
        
        // For clients: check email/phone verification
        if (userType === 'client' || !userType) {
          const isEmailVerified = user.is_email_verified;
          const isPhoneVerified = user.is_phone_verified;
          
          console.log('TwoFactorAuth - Client verification status:', { isEmailVerified, isPhoneVerified });
          
          // If either email or phone is verified, redirect to dashboard
          if (isEmailVerified || isPhoneVerified) {
            console.log('Client is already verified, redirecting to dashboard');
            navigate("/dashboard");
          }
        } 
        // For firm admin: check two_factor_authentication status
        else if (userType === 'admin' || userType === 'firm') {
          const twoFactorEnabled = user.two_factor_authentication;
          
          console.log('TwoFactorAuth - Firm admin 2FA status:', { twoFactorEnabled });
          
          // If 2FA is already enabled, redirect to firm admin dashboard
          if (twoFactorEnabled === true) {
            console.log('Firm admin 2FA already enabled, redirecting to firm admin dashboard');
            // Check subscription plan first
            if (user.subscription_plan === null || user.subscription_plan === undefined) {
              navigate("/firmadmin/finalize-subscription", { replace: true });
            } else {
              navigate("/firmadmin", { replace: true });
            }
          }
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
