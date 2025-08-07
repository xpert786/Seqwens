import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import { EmailIcon, PhoneIcon } from "../components/icons";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import logo from "../assets/logo.png";

export default function TwoFactorAuth() {
  const navigate = useNavigate();

  return (
    <div
      className="create-account-page d-flex align-items-center justify-content-center vh-100 position-relative"
      style={{
        backgroundColor: "#2f3d59",
        padding: "60px 20px",
      }}
    >
      <img
        src={logo}
        alt="Logo"
        style={{
          position: "absolute",
          top: "20px",
          left: "80px",
          height: "50px",
          objectFit: "contain",
        }}
      />


      <div className="twofa-box">
        <div className="twofa-content">
          <div className="align-items-center mb-2 ">
            <h5
              className="mb-0 me-3"
              style={{
                color: "#FFFFFF",
                fontWeight: "500",
                fontSize: "30px",
                fontFamily: "BasisGrotesquePro",
              }}
            >
              SECURE YOUR ACCOUNT WITH 2FA
            </h5>
            <p
              className="mb-0"
              style={{
                color: "#FFFFFF",
                fontSize: "21px",
                fontWeight: "400",
                fontFamily: "BasisGrotesquePro",
              }}
            >
              Two-Factor Authentication adds an extra security layer, protecting
              your account with a code and password.
            </p>
          </div>

          <div
            className="twofa-options"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              marginTop: "60px",
            }}
          >
            {/* EMAIL OPTION */}
            <button
              className="twofa-btn"
              onClick={() => navigate("/verify-email")}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ padding: "10px", marginRight: "16px" }}>
                  <EmailIcon style={{ color: "#00C2CB" }} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: "500", color: "#3B4A66", fontSize:"18px",fontFamily: "BasisGrotesquePro" }}>EMAIL</div>
                  <div style={{ fontSize: "14px", color: "#3B4A66", fontWeight:"400px",fontFamily: "BasisGrotesquePro"  }}>
                    We’ll send a verification code to your email address.
                  </div>
                </div>
              </div>
              <ArrowForwardIosIcon style={{ fontSize: "16px", color: "#3B4A66" }} />
            </button>

            {/* PHONE OPTION */}
            <button
              className="twofa-btn"
              onClick={() => navigate("/verify-phone")}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ padding: "10px", marginRight: "16px" }}>
                  <PhoneIcon style={{ color: "#00C2CB" }} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: "500", color: "#3B4A66", fontSize:"18px",fontFamily: "BasisGrotesquePro" }}>PHONE</div>
                  <div style={{ fontSize: "14px", color: "#3B4A66", fontWeight:"400px",fontFamily: "BasisGrotesquePro"  }}>
                    We’ll send an SMS with a verification code to your phone.
                  </div>
                </div>
              </div>
              <ArrowForwardIosIcon style={{ fontSize: "16px", color: "#3B4A66" }} />
            </button>
          </div>
        </div>
      </div>

    </div>

  );
}
