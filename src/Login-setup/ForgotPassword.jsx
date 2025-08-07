import { useState } from "react";
import "../styles/Login.css";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSendCode = () => {
    console.log("Sending reset code to:", email);
    navigate("/otp-verification");
  };

  const handleResend = () => {
    console.log("Resending code...");
    navigate("/otp-verification");
  };

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
          position: 'absolute',
          top: '20px',
          left: '80px',
          height: '50px',
          objectFit: 'contain',
        }}
      />


      <div
        className="forgot-box"
        style={{
          backgroundColor: "#2f4160",
          padding: "60px 60px",
          borderRadius: "25px",
          width: "100%",
          maxWidth: "590px",
          minHeight: "500px",
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>

          <div className="mb-4" style={{ marginTop: "20px" }} >
            <h5 className="mb-1" style={{ color: "#FFFFFF", fontSize: "35px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}> FORGOT PASSWORD ?</h5>
            <p className="mb-0" style={{ color: "#FFFFFF", fontSize: "21px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}> Please enter your valid email account to send the verification code to reset your password.</p>
          </div>

          <div className="form-group" style={{ marginBottom: "25px", marginTop: "50px" }}>
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 500, fontSize: "15px", color: "#FFFFFF" }}>Email</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="Enter Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                border: "none",
                outline: "none",
                fontSize: "15px",
                fontFamily: "BasisGrotesquePro"
              }}
            />

          </div>

          <button
            onClick={handleSendCode}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#F56D2D",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "500",
              fontSize: "18px",
              cursor: "pointer",
              marginBottom: "20px",
              fontFamily: "BasisGrotesquePro"
            }}
          >
            Send Code
          </button>
        </div>
      </div>
    </div>
  );
}
