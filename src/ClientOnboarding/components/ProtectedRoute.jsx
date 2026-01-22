// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../utils/userUtils";

export default function ProtectedRoute({ children }) {
  const userIsLoggedIn = isLoggedIn();

  if (!userIsLoggedIn) {
    // Use React Router Navigate which respects the basename
    return <Navigate to="/seqwens-frontend/login" replace />;
  }

  return children;
}
