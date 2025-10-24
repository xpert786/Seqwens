// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../utils/userUtils";

export default function ProtectedRoute({ children }) {
  const userIsLoggedIn = isLoggedIn();
  return userIsLoggedIn ? children : <Navigate to="/login" />;
}
