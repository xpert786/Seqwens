import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, getStorage } from "../utils/userUtils";

/**
 * AuthRedirect component that redirects authenticated users to their appropriate dashboard
 * Use this to wrap login and register pages to prevent logged-in users from accessing them
 */
export default function AuthRedirect({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    if (isLoggedIn()) {
      // Get user type from storage
      const storage = getStorage();
      const userType = storage?.getItem("userType");
      
      console.log('AuthRedirect - User type:', userType);
      
      // Redirect based on user type
      if (userType === 'super_admin') {
        navigate("/superadmin", { replace: true });
      } else if (userType === 'admin') {
        navigate("/firmadmin", { replace: true });
      } else {
        // Default to client dashboard
        navigate("/dashboard", { replace: true });
      }
    }
  }, [navigate]);

  // If user is logged in, don't render the children (redirect will happen)
  if (isLoggedIn()) {
    return null;
  }

  // If user is not logged in, render the children (login/register forms)
  return children;
}
