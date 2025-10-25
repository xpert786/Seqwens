// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../utils/userUtils";
import { getLoginUrl } from "../utils/urlUtils";

export default function ProtectedRoute({ children }) {
  const userIsLoggedIn = isLoggedIn();
  
  if (!userIsLoggedIn) {
    // Get the conditional login URL
    const loginUrl = getLoginUrl();
    
    // If we're using a server URL, redirect to the full URL
    if (loginUrl.includes('168.231.121.7')) {
      window.location.href = loginUrl;
      return null;
    }
    
    // Otherwise use React Router Navigate for localhost
    return <Navigate to="/login" />;
  }
  
  return children;
}
