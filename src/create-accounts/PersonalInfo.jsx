import React from 'react';
import logo from "../assets/logo.png";
import "../styles/CreateAccount.css";
import { Link } from "react-router-dom";
import { useState } from 'react';
import { PasswordStrengthBar } from "../components/icons";
import { useNavigate } from 'react-router-dom';


const PersonalInfo = () => {

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    // Simulate account creation and mark user as logged in
    localStorage.setItem("isLoggedIn", "true");

    // Redirect to data intake page
    navigate("/dataintake");
  }

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const validateLength = password.length >= 8;
  const validateNumber = /\d/.test(password);
  const validateUpperLower = /(?=.*[a-z])(?=.*[A-Z])/.test(password);
  const validateSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return (
    <div className="create-account-page d-flex align-items-center justify-content-center vh-100 position-relative">
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
        className="outer-container text-white p-5 shadow w-75"
        style={{
          maxWidth: '900px',
          borderRadius: '30px',
          background: ' #3B4A66)',
        }}
      >
        <h2 className="mb-1" style={{
          fontFamily: "'BasisGrotesquePro'",
          color: " #FFFFFF",
          fontWeight: "700",
          fontSize: "34px",
        }}>Create Your Account</h2>
        <p
          className="mb-0"
          style={{
            fontFamily: "BasisGrotesquePro",
            color: " #FFFFFF)",
            fontWeight: "400",
            fontSize: "22px"
          }}
        >
          Start your return by creating a secure account.
        </p>

        {/* White Box */}
        <div className="bg-white text-dark rounded-4 p-4 " style={{ marginTop: "30px" }}>
          <form>

            <div className="mb-3">
              <label
                className="form-label"
                style={{ fontSize: "17px", fontWeight: "500", color: "#3B4A66", fontFamily: "BasisGrotesquePro",  }}
              >
                New Password
              </label>
              <div
                className="input-group rounded-3"
                style={{ border: "1px solid #4B5563",  boxShadow: "none" }}
              >
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control border-0"
                  placeholder="Enter Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ boxShadow: "none", fontFamily: "BasisGrotesquePro",  }}
                  onFocus={(e) => e.target.parentNode.style.border = "1px solid #4B5563"}
                  onBlur={(e) => e.target.parentNode.style.border = "1px solid #4B5563"}
                />
                <span
                  className="input-group-text bg-white border-0"
                  style={{ cursor: 'pointer' }}
                  onClick={togglePasswordVisibility}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </span>
              </div>
            </div>

            <div className="p-3 mb-3 rounded-3" style={{ backgroundColor: '#FFFFFF', border: "1px solid #E8F0FF" }}>
              <div className="d-flex align-items-start">
                <div className="me-2 pt-1">
                  <PasswordStrengthBar />
                </div>
              </div>

              <div className="d-flex mt-2">
                <div>
                  <div className="d-flex flex-wrap gap-4 mb-2">
                    <div className={`small ${validateLength ? 'text-success' : 'text-danger'}`} style={{ fontFamily: "BasisGrotesquePro" }}>
                      {validateLength ? '✔' : '✘'} At Least 8 Characters
                    </div>
                    <div className={`small ${validateNumber ? 'text-success' : 'text-danger'}`} style={{ fontFamily: "BasisGrotesquePro" }}>
                      {validateNumber ? '✔' : '✘'} At least one number
                    </div>
                    <div className={`small ${validateUpperLower ? 'text-success' : 'text-danger'}`} style={{ fontFamily: "BasisGrotesquePro" }}>
                      {validateUpperLower ? '✔' : '✘'} Uppercase/Lowercase letter
                    </div>
                  </div>

                  <div className={`small ${validateSpecialChar ? 'text-success' : 'text-danger'}`} style={{ fontFamily: "BasisGrotesquePro" }}>
                    {validateSpecialChar ? '✔' : '✘'} At least one special character
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-3" >
              <label className="form-label" style={{ fontSize: "17px", fontWeight: "500", color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>Confirm Password</label>
              <input
                type="password"
                className="form-control rounded-3"
                placeholder="Enter Your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ border: "1px solid #4B5563", boxShadow: "none", fontFamily: "BasisGrotesquePro" }}
              />
            </div>


            <div className="form-check mb-3">
              <input className="form-check-input" type="checkbox" id="termsCheck" />
              <label className="form-check-label" htmlFor="termsCheck" style={{ fontFamily: "BasisGrotesquePro" }}>
                I agree to the{' '}
                <span className=" fw-semibold" style={{ color: "#F49C2D", fontFamily: "BasisGrotesquePro" }}>Terms of Use</span> &{' '}
                <span className=" fw-semibold" style={{ color: "#F49C2D", fontFamily: "BasisGrotesquePro" }}>Privacy Policy</span>.
              </label>
            </div>
          </form>
        </div>

        <button
          type="button"
          className="btn w-40 text-white rounded-3"
          style={{ backgroundColor: "#F56D2D", fontFamily: "BasisGrotesquePro", marginTop: "30px", fontSize: "17px", fontWeight: "600" }}
          onClick={handleCreateAccount}
        >
          Create Account
        </button>
      </div>
    </div>
  );
}
export default PersonalInfo;