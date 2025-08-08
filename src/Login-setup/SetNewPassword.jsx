// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "../styles/Login.css";
// import logo from "../assets/logo.png";
// import { PasswordStrengthBar } from "../components/icons";

// export default function SetNewPassword() {
//     const [showPassword, setShowPassword] = useState(false);
//     const [confirmPassword, setConfirmPassword] = useState("");
//     const [password, setPassword] = useState('');
//     const navigate = useNavigate();

//     const getStrength = () => {
//         let strength = 0;
//         if (newPassword.length >= 8) strength++;
//         if (/[A-Z]/.test(newPassword)) strength++;
//         if (/[0-9]/.test(newPassword)) strength++;
//         if (/[^A-Za-z0-9]/.test(newPassword)) strength++;
//         return strength;
//     };

//     const handleResetPassword = () => {
//         if (newPassword !== confirmPassword) {
//             alert("Passwords do not match!");
//             return;
//         }
        
//         console.log("Password reset to:", newPassword);
        
//     };
//     const togglePasswordVisibility = () => setShowPassword(!showPassword);

//     const validateLength = password.length >= 8;
//     const validateNumber = /\d/.test(password);
//     const validateUpperLower = /(?=.*[a-z])(?=.*[A-Z])/.test(password);
//     const validateSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

//     return (
//         <div
//             className="create-account-page d-flex align-items-center justify-content-center vh-100 position-relative"
//             style={{
//                 backgroundColor: "#2f3d59",
//                 padding: "60px 20px",
//             }}
//         >
//             <img
//                 src={logo}
//                 alt="Logo"
//                 style={{
//                     position: 'absolute',
//                     top: '20px',
//                     left: '80px',
//                     height: '50px',
//                     objectFit: 'contain',
//                 }}
//             />
//             <div
//                 className="set-password-box"
//                 style={{
//                     backgroundColor: "#3B4A66",
//                     padding: "60px 60px",
//                     borderRadius: "30px",
//                     width: "100%",
//                     maxWidth: "590px",
//                     minHeight: "580px",
//                     color: "white",
                    
//                 }}
//             >

//                 <div className="align-items-center mb-2 " style={{ marginTop: "20px" }}>
//                     <h5
//                         className="mb-0 me-3"
//                         style={{
//                             fontWeight: "500",
//                             marginBottom: "15px",
//                             fontSize: "35px",
//                             color: "#FFFFFF",
//                             fontFamily: "BasisGrotesquePro",
//                         }}
//                     >
//                         SET NEW PASSWORD
//                     </h5>
//                     <p
//                         className="mb-0"
//                         style={{
//                             fontFamily: "BasisGrotesquePro",
//                             fontWeight: 400,
//                             fontSize: "18px",
//                             color: "#FFFFFF",
//                             marginBottom: "25px",
//                             lineHeight: "1.5",
//                         }}
//                     >
//                         Use at least 8 characters with a mix of uppercase, lowercase, numbers, and special characters.
//                     </p>
//                 </div>
//                 <div className="mb-2">
//                     <label style={{ marginBottom: "5px", marginTop: "32px",  fontSize: "17px", fontWeight: "500", color: "#FFFFFF", fontFamily: "BasisGrotesquePro", }}>New Password</label>


//                     <div
//                         className="input-group rounded-3"
//                         style={{ border: "1px solid #4B5563", boxShadow: "none", }}
//                     >
//                         <input
//                             type={showPassword ? 'text' : 'password'}
//                             className="form-control border-0"
//                             placeholder="Enter Your password"
//                             value={password}
//                             onChange={(e) => setPassword(e.target.value)}
//                             style={{ boxShadow: "none", fontFamily: "BasisGrotesquePro", }}
//                             onFocus={(e) => e.target.parentNode.style.border = "1px solid #4B5563"}
//                             onBlur={(e) => e.target.parentNode.style.border = "1px solid #4B5563"}
//                         />
//                         <span
//                             className="input-group-text bg-white border-0"
//                             style={{ cursor: 'pointer' }}
//                             onClick={togglePasswordVisibility}
//                         >
//                             <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
//                         </span>
//                     </div>

//                     {/* Password Strength Meter */}
//                     <div className="p-3 mb-3 rounded-3" style={{ backgroundColor: '#FFFFFF', border: "1px solid #E8F0FF", marginTop: "18px" }}>
//                         <div className="d-flex align-items-start">
//                             <div className="me-2 pt-1">
//                                 <PasswordStrengthBar />
//                             </div>
//                         </div>

//                         <div className="d-flex mt-2">
//                             <div>
//                                 <div className="d-flex flex-wrap gap-4 mb-2">
//                                     <div className={`small ${validateLength ? 'text-success' : 'text-danger'}`} style={{ fontFamily: "BasisGrotesquePro" }}>
//                                         {validateLength ? '✔' : '✘'} At Least 8 Characters
//                                     </div>
//                                     <div className={`small ${validateNumber ? 'text-success' : 'text-danger'}`} style={{ fontFamily: "BasisGrotesquePro" }}>
//                                         {validateNumber ? '✔' : '✘'} At least one number
//                                     </div>
//                                     <div className={`small ${validateUpperLower ? 'text-success' : 'text-danger'}`} style={{ fontFamily: "BasisGrotesquePro" }}>
//                                         {validateUpperLower ? '✔' : '✘'} Uppercase/Lowercase letter
//                                     </div>
//                                 </div>

//                                 <div className={`small ${validateSpecialChar ? 'text-success' : 'text-danger'}`} style={{ fontFamily: "BasisGrotesquePro" }}>
//                                     {validateSpecialChar ? '✔' : '✘'} At least one special character
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 <label style={{ marginTop: "20px", marginBottom: "5px",  fontSize: "17px", fontWeight: "500", color: "#FFFFFF", fontFamily: "BasisGrotesquePro", }}>Confirm Password</label>
//                 <input
//                     type="password"
//                     placeholder="Enter Your password"
//                     value={confirmPassword}
//                     onChange={(e) => setConfirmPassword(e.target.value)}
//                     style={{
//                         width: "100%",
//                         padding: "12px",
//                         borderRadius: "10px",
//                         border: "none",
//                         outline: "none",
//                         fontSize: "15px",
//                         marginBottom: "30px",
//                     }}
//                 />

//                 <button
//                     onClick={handleResetPassword}
//                     style={{
//                         width: "100%",
//                         padding: "10px",
//                         backgroundColor: "#F56D2D",
//                         color: "#FFFFFF",
//                         border: "none",
//                         borderRadius: "8px",
//                         fontFamily: "BasisGrotesquePro",
//                         fontWeight: "500",
//                         fontSize: "18px",
//                         cursor: "pointer",
//                     }}
//                 >
//                     Reset Password
//                 </button>
//             </div>
//         </div>
//     );
// }


import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SetNewPassword.css";
import { PasswordStrengthBar } from "../components/icons";
import FixedLayout from "../components/FixedLayout"; // Adjust path if needed

export default function SetNewPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleResetPassword = () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    console.log("Password reset to:", password);
    // Add password reset logic here
  };

  const validateLength = password.length >= 8;
  const validateNumber = /\d/.test(password);
  const validateUpperLower = /(?=.*[a-z])(?=.*[A-Z])/.test(password);
  const validateSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    <FixedLayout>
      <div className="set-password-wrapper">
        <div className="set-password-box">
          <h5 className="password-title">SET NEW PASSWORD</h5>
          <p className="password-subtitle">
            Use at least 8 characters with a mix of uppercase, lowercase, numbers, and special characters.
          </p>

          <div className="mb-2">
            <label className="password-label">New Password</label>
            <div className="input-group custom-input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control custom-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="input-group-text toggle-password-icon" onClick={togglePasswordVisibility}>
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </span>
            </div>

            <div className="password-strength-box">
              <div className="d-flex align-items-start mb-2">
                <PasswordStrengthBar />
              </div>
              <div className="d-flex flex-wrap gap-4 mb-2 password-criteria">
                <div className={`small ${validateLength ? 'text-success' : 'text-danger'}`}>
                  {validateLength ? '✔' : '✘'} At least 8 characters
                </div>
                <div className={`small ${validateNumber ? 'text-success' : 'text-danger'}`}>
                  {validateNumber ? '✔' : '✘'} At least one number
                </div>
                <div className={`small ${validateUpperLower ? 'text-success' : 'text-danger'}`}>
                  {validateUpperLower ? '✔' : '✘'} Uppercase/Lowercase letter
                </div>
                <div className={`small ${validateSpecialChar ? 'text-success' : 'text-danger'}`}>
                  {validateSpecialChar ? '✔' : '✘'} At least one special character
                </div>
              </div>
            </div>
          </div>

          <label className="password-label">Confirm Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="form-control confirm-password-input"
          />

          <button className="reset-button" onClick={handleResetPassword}>
            Reset Password
          </button>
        </div>
      </div>
    </FixedLayout>
  );
}
