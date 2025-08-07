import { useState } from "react";
import "../styles/Login.css";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa"; // Add react-icons for the tick mark

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

    // Show popup
    setShowPopup(true);
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard");
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
          position: "absolute",
          top: "20px",
          left: "80px",
          height: "50px",
          objectFit: "contain",
        }}
      />

      <div
        className="otp-box"
        style={{
          backgroundColor: "#3B4A66",
          padding: "60px 60px",
          borderRadius: "25px",
          width: "100%",
          maxWidth: "590px",
          minHeight: "500px",
          color: "white",

        }}
      >
        <div className="align-items-center mb-2 " style={{ marginTop: "20px" }}>
          <h5
            className="mb-0 me-3"
            style={{
              fontWeight: "500",
              marginBottom: "15px",
              fontSize: "35px",
              color: "#FFFFFF",
              fontFamily: "BasisGrotesquePro",
            }}
          >
            VERIFY YOUR EMAIL
          </h5>
          <p
            className="mb-0"
            style={{
              fontFamily: "BasisGrotesquePro",
              fontWeight: 400,
              fontSize: "18px",
              color: "#FFFFFF",
              marginBottom: "25px",
              lineHeight: "1.5",
            }}
          >
            A verification code has been sent to{" "}
            <span style={{ color: "#F49C2D", fontWeight: "bold" }}>
              john@gmail.com
            </span>
            .
            <br />
            Please check your email and enter the code below to activate your
            account.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            marginBottom: "30px",
            marginTop: "55px",
          }}
        >
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              style={{
                width: "50px",
                height: "50px",
                fontSize: "24px",
                textAlign: "center",
                borderRadius: "8px",
                border: "none",
                outline: "none",
              }}
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#f5663f",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "500",
            fontSize: "18px",
            cursor: "pointer",
            marginBottom: "20px",
            fontFamily: "BasisGrotesquePro",
          }}
        >
          Verify OTP
        </button>

        <p
          style={{
            textAlign: "center",
            fontFamily: "BasisGrotesquePro",
            fontWeight: 500,
            fontSize: "16px",
            color: "#FFFFFF",
          }}
        >
          Didn’t receive the code?{" "}
          <span
            style={{
              color: "#F56D2D",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "16px",
              fontFamily: "BasisGrotesquePro",
              borderBottom: "2px solid #F56D2D",
              paddingBottom: "2px",
            }}
          >
            Resend Code
          </span>

        </p>
      </div>

      {/* Popup Modal */}
      {showPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              padding: "40px",
              borderRadius: "25px",
              width: "420px",
              textAlign: "center",

            }}
          >
            <FaCheckCircle
              size={60}
              color="#00C8A0"
              style={{ marginBottom: "20px" }}
            />
            <h4
              style={{
                fontWeight: "500",
                fontSize: "24px",
                marginBottom: "10px",
                color: "#3B4A66",
                fontFamily: "BasisGrotesquePro",
              }}
            >
              VERIFIED SUCCESSFULLY
            </h4>
            <p
              style={{
                fontSize: "16px",
                fontWeight: "400",
                marginBottom: "25px",
                color: "#3B4A66",
                fontFamily: "BasisGrotesquePro",
              }}
            >
              Congratulations! your account{" "}
              <span style={{ color: "#F49C2D", fontWeight: "bold" }}>
                john@gmail.com
              </span>{" "}
              has been verified.
            </p>
            <button
              onClick={handleGoToDashboard}
              style={{
                backgroundColor: "#F56D2D",
                color: "#FFFFFF",
                border: "none",
                padding: "12px 25px",
                borderRadius: "8px",
                fontSize: "18px",
                fontWeight: "500",
                cursor: "pointer",
                fontFamily: "BasisGrotesquePro",
              }}
            >
              Go To Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
