import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, getStorage, clearUserData } from "../utils/userUtils";

/**
 * AuthRedirect component that redirects authenticated users to their appropriate dashboard
 * Use this to wrap login and register pages to prevent logged-in users from accessing them
 */
export default function AuthRedirect({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const isActuallyLoggedIn = isLoggedIn();
    const sessionMarked = sessionStorage.getItem("isLoggedIn") === "true" || localStorage.getItem("isLoggedIn") === "true";

    // If session indicators exist but isLoggedIn() is false, it means we have a stale or corrupted session
    if (!isActuallyLoggedIn && sessionMarked) {
      console.warn('[AUTH_REDIRECT] Stale session indicators found, performing automatic cleanup');
      clearUserData();
      // No redirect needed, just stay on the current flow (Signup/Login)
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
