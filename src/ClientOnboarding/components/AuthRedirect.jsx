import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isLoggedIn, getStorage, clearUserData } from "../utils/userUtils";

/**
 * AuthRedirect component that redirects authenticated users to their appropriate dashboard
 * Use this to wrap login and register pages to prevent logged-in users from accessing them
 */
export default function AuthRedirect({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isActuallyLoggedIn = isLoggedIn();
    const sessionMarked = sessionStorage.getItem("isLoggedIn") === "true" || localStorage.getItem("isLoggedIn") === "true";
    const currentPath = location.pathname;
    
    console.log('[AUTH_REDIRECT] Checking auth for path:', currentPath, { isActuallyLoggedIn, sessionMarked });
    
    // List of signup-specific paths that should always have a clean slate
    // We want to ensure that if a user hits "Signup" from the public website, 
    // they don't get trapped in a redirect loop to an old Firm Admin account.
    const isSignupPath = currentPath.includes('create-account') || 
                        currentPath.includes('firm-signup') || 
                        currentPath.includes('personal-info');

    // Case 1: Stale session indicators found but token is missing/expired
    if (!isActuallyLoggedIn && sessionMarked) {
      console.warn('[AUTH_REDIRECT] Stale session indicators found, performing automatic cleanup');
      clearUserData();
      return;
    }

    // Case 2: User is on a signup path but has session markers
    // Even if isLoggedIn() is true (token exists), hitting a Signup CTA from the website 
    // implies an intention to start fresh. We clear data to avoid the "unexpected Firm Admin load".
    if (isSignupPath && sessionMarked) {
      console.log('[AUTH_REDIRECT] Signup path detected with existing session. Clearing session for fresh signup flow.');
      clearUserData();
      // After clearing, we stay on the current path (children will render)
      return;
    }

    if (isActuallyLoggedIn) {
      // Get user type from storage
      const storage = getStorage();
      const userType = storage?.getItem("userType");

      console.log('AuthRedirect - User type:', userType);

      // Redirect based on user type
      // Note: basename="/seqwens-frontend" is set in main.jsx, so paths are relative
      if (userType === 'super_admin') {
        navigate("/superadmin", { replace: true });
      } else if (userType === 'support_admin' || userType === 'billing_admin') {
        navigate("/superadmin", { replace: true });
      } else if (userType === 'admin' || userType === 'firm') {
        navigate("/firmadmin", { replace: true });
      } else if (userType === 'tax_preparer') {
        navigate("/taxdashboard", { replace: true });
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
