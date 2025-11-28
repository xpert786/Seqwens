import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Login.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import FixedLayout from "../components/FixedLayout";
import { userAPI, validateEmail, handleAPIError } from "../utils/apiUtils";
import { setTokens } from "../utils/userUtils";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate form
    if(!password.trim() && !email.trim()) {
      setErrors({ 
        email: 'Please enter your email',
        password: 'Please enter your password'
      });
      return;
    }

    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }
    
    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }
    
    if (!password.trim()) {
      setErrors({ password: 'Password is required' });
      return;
    }



    setIsLoading(true);
    
    try {
      const response = await userAPI.login({ email, password });
      
      // Choose storage based on Remember Me selection
      const storage = rememberMe ? localStorage : sessionStorage;
      
      // Store user data
      storage.setItem("isLoggedIn", "true");
      storage.setItem("userData", JSON.stringify(response.user));
      
      // Store tokens using the utility function
      setTokens(response.access_token, response.refresh_token, rememberMe);
      
      // Check user type and navigate to appropriate dashboard
      const user = response.user;
      const userType = user.user_type;
      
      console.log('User logged in with type:', userType);
      
      // Store user type in storage for future reference
      storage.setItem("userType", userType);
      
      // Route based on user type
      if (userType === 'super_admin') {
        // Redirect to super admin dashboard
        navigate("/superadmin");
      } else if (userType === 'support_admin' || userType === 'billing_admin') {
        // Redirect to admin dashboard
        navigate("/superadmin");
      } else if (userType === 'admin') {
        // Redirect to firm admin dashboard
        navigate("/firmadmin");
      } else if (userType === 'tax_preparer') {
        // Redirect to tax preparer dashboard
        navigate("/taxdashboard");
      } else if (userType === 'client' || !userType) {
        // Client routing - check verification status
        const isEmailVerified = user.is_email_verified;
        const isPhoneVerified = user.is_phone_verified;
        const isCompleted = user.is_completed;
        
        // If neither email nor phone is verified, go to two-factor authentication
        if (!isEmailVerified && !isPhoneVerified) {
          navigate("/two-auth");
        } else {
          // If either email or phone is verified, check completion status
          if (isCompleted) {
            // User is completed, go to main dashboard
            navigate("/dashboard");
          } else {
            // User is not completed, stay on dashboard-first page
            navigate("/dashboard-first");
          }
        }
      } else {
        // Fallback for unknown user types
        console.warn('Unknown user type:', userType);
        navigate("/dashboard");
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ 
        general: handleAPIError(error) 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FixedLayout>
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <h5 className="login-title">WELCOME BACK</h5>
            <p className="login-subtitle">Sign in to your account to continue</p>
          </div>

          {errors.general && (
            <div className="alert alert-danger" role="alert">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label className="form-label">Email or Username</label>
              <input
                type="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="Enter your email or username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email}</div>
              )}
            </div>

            <div className="form-group password-group">
              <label className="form-label">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors(prev => ({ ...prev, password: '' }));
                  }
                }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-password"
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
              {errors.password && (
                <div className="invalid-feedback">{errors.password}</div>
              )}
            </div>

            <div className="form-options">
              <div className="form-check">
                <input 
                  type="checkbox" 
                  className="form-check-input" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label className="form-check-label">Remember Me</label>
              </div>
              <Link to="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>
            </div>

            <button 
              type="submit" 
              className="login-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            
            <p className="resend-text" style={{paddingTop:"20px"}}>
                Didn't have an Account?{" "}
               <Link to="/create-account">
               <span className="resend-link">
                 Sign Up
                </span>
               </Link> 
              </p>
          </form>
        </div>
      </div>
    </FixedLayout>
  );
}


