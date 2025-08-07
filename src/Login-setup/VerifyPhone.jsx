import { useState } from "react";
import "../styles/Login.css";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";

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
            VERIFY YOUR PHONE
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
            A verification code has been sent to{" "}<br />
            <span style={{ color: "#F49C2D", fontWeight: "bold" }}>+1 ******3960</span>.{" "}
            Please check your SMS and enter the code below to activate your account..
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
            fontFamily: "BasisGrotesquePro",
            cursor: "pointer",
            marginBottom: "20px",
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
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "40px 30px",
              borderRadius: "20px",
              width: "335px",
              textAlign: "center",
              boxShadow: "0px 0px 20px rgba(0, 0, 0, 0.2)",
            }}
          >

            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: "#00C8A0",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                margin: "0 auto 20px auto",
              }}
            >
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

            {/* Title */}
            <h5
              style={{
                fontWeight: "500",
                fontSize: "22px",
                marginBottom: "10px",
                color: "#3B4A66",
                fontFamily: "BasisGrotesquePro",
              }}
            >
              VERIFIED SUCCESSFULLY
            </h5>

            {/* Message */}
            <p
              style={{
                fontSize: "16px",
                fontWeight: "400",
                marginBottom: "25px",
                color: "#3B4A66",
                fontFamily: "BasisGrotesquePro",
              }}
            >
              Congratulations! Your phone number{" "}
              <span style={{ color: "#F49C2D", fontWeight: 600 }}><br />
                +1-234-567-8901
              </span>{" "}
              has been verified.
            </p>

            {/* Go To Dashboard Button */}
            <button
              onClick={handleGoToDashboard}
              style={{
                backgroundColor: "#F56D2D",
                color: "#FFFFFF",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "500",
                fontWeight: 600,
                cursor: "pointer",
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
