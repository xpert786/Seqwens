import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn } from "../utils/userUtils";

/**
 * AuthRedirect component that redirects authenticated users to dashboard
 * Use this to wrap login and register pages to prevent logged-in users from accessing them
 */
export default function AuthRedirect({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    if (isLoggedIn()) {
      // Redirect to dashboard if user is already authenticated
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  // If user is logged in, don't render the children (redirect will happen)
  if (isLoggedIn()) {
    return null;
  }

  // If user is not logged in, render the children (login/register forms)
  return children;
}
