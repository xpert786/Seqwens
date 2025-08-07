import { useNavigate } from "react-router-dom";
import { useState } from "react";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";
import "../styles/Login.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      localStorage.setItem("isLoggedIn", "true");
      navigate("/two-auth");
    } else {
      alert("Please enter email and password");
    }
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
        className="card p-5 rounded-5 shadow"
        style={{
          backgroundColor: "#3b4a66",
          width: "600px",
          borderRadius: "30px",
          minHeight: "580px",
        }}
      >
        <div className="mb-4" style={{marginTop:"20px"}}>
          <h5 className="mb-1" style={{ color: "#FFFFFF", fontSize: "35px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>WELCOME BACK</h5>
          <p className="mb-0" style={{ color: "#FFFFFF", fontSize: "21px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleLogin} style={{ marginTop: "20px" }}>
          <div className="mb-3">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: 500, fontSize: "15px", color: "#FFFFFF" }}>Email or Username</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter your email or username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ fontFamily: "BasisGrotesquePro" }}
            />
          </div>

          <div className="mb-3" style={{ position: "relative" }}>
            <label
              className="form-label"
              style={{
                fontFamily: "BasisGrotesquePro",
                fontWeight: 500,
                fontSize: "15px",
                color: "#FFFFFF",
              }}
            >
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: "40px", fontFamily: "BasisGrotesquePro" }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "60%",
                transform: "translateY(-25%)",
                cursor: "pointer",
                color: "#6c757d",
              }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="form-check">
              <input type="checkbox" className="form-check-input" />
              <label className="form-check-label" style={{ fontFamily: "BasisGrotesquePro", fontSize:"15px", fontWeight:"500", color:"#FFFFFF" }}>Remember Me</label>
            </div>
            <Link to="/forgot-password"  style={{ fontFamily: "BasisGrotesquePro", color:"#EF4444", fontSize:"15px", fontWeight:"500" }}>
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn w-100 text-white"
            style={{ backgroundColor: "#F56D2D", marginTop: "20px" }}
          >
            Login
          </button>
        </form>
      </div>
    </div>

  );
}
