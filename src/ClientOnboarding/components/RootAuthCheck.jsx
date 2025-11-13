import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, getStorage } from "../utils/userUtils";

/**
 * RootAuthCheck component that handles authentication for the root path
 * If user is not authenticated, redirects to login page
 * If user is authenticated, redirects to appropriate dashboard based on user type
 */
export default function RootAuthCheck() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    if (isLoggedIn()) {
      // Get user type from storage
      const storage = getStorage();
      const userType = storage?.getItem("userType");
      const userData = JSON.parse(storage?.getItem("userData") || "{}");
      
      console.log('Root check - User type:', userType);
      
      // Redirect based on user type
      if (userType === 'super_admin') {
        navigate("/superadmin", { replace: true });
      } else if (userType === 'admin') {
        navigate("/firmadmin", { replace: true });
      } else if (userType === 'tax_preparer') {
        navigate("/taxdashboard", { replace: true });
      } else if (userType === 'client' || !userType) {
        // Check if client is verified
        const isEmailVerified = userData.is_email_verified;
        const isPhoneVerified = userData.is_phone_verified;
        const isCompleted = userData.is_completed;
        
        if (!isEmailVerified && !isPhoneVerified) {
          navigate("/two-auth", { replace: true });
        } else if (isCompleted) {
          // User is completed, go to main dashboard
          navigate("/dashboard", { replace: true });
        } else {
          // User is not completed, stay on dashboard-first page
          navigate("/dashboard-first", { replace: true });
        }
      } else {
        // Fallback to dashboard
        navigate("/dashboard", { replace: true });
      }
    } else {
      // Not logged in, redirect to login
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Show loading while redirecting
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Redirecting...</p>
      </div>
    </div>
  );
}
