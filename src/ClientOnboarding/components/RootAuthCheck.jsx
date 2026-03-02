import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, getStorage } from "../utils/userUtils";
import { userAPI } from "../utils/apiUtils";

/**
 * RootAuthCheck component that handles authentication for the root path.
 * If user is not authenticated, redirects to login page.
 * If user is authenticated, calls the server to determine the REAL current role
 * and redirects to the appropriate dashboard. This handles saved-token sessions
 * correctly by not relying on potentially stale localStorage data.
 */
export default function RootAuthCheck() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!isLoggedIn()) {
        navigate("/login", { replace: true });
        return;
      }
      try {
        // Ask the server what contexts/roles this user currently has — 
        // this is the source of truth and avoids stale userType in localStorage.
        const contextsData = await userAPI.getAvailableContexts();

        if (contextsData.success) {
          const { needs_role_selection, needs_firm_selection, all_roles, all_firms } = contextsData.data;

          // If user needs to pick role or firm, redirect to the context selection page
          if (needs_role_selection || needs_firm_selection) {
            navigate("/select-context", {
              state: {
                needs_role_selection,
                needs_firm_selection,
                all_roles,
                all_firms,
              },
              replace: true,
            });
            return;
          }
        }
      } catch (error) {
        // If the API call fails (network error, token expired, etc.),
        // fall back to reading userType from storage.
        console.warn("RootAuthCheck: getAvailableContexts failed, falling back to localStorage.", error);
      }

      // Fallback: use stored userType to navigate
      const storage = getStorage();
      const userType = storage?.getItem("userType");
      const userData = JSON.parse(storage?.getItem("userData") || "{}");

      console.log("Root check (fallback) - User type:", userType);

      if (userType === "super_admin") {
        navigate("/superadmin", { replace: true });
      } else if (userType === "support_admin" || userType === "billing_admin") {
        navigate("/superadmin", { replace: true });
      } else if (userType === "admin" || userType === "firm") {
        navigate("/firmadmin", { replace: true });
      } else if (userType === "tax_preparer") {
        navigate("/taxdashboard", { replace: true });
      } else if (userType === "client" || !userType) {
        const isEmailVerified = userData.is_email_verified;
        const isPhoneVerified = userData.is_phone_verified;

        if (!isEmailVerified && !isPhoneVerified) {
          navigate("/two-auth", { replace: true });
        } else if (userData.onboarding_completed) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/dashboard-first", { replace: true });
        }
      } else {
        navigate("/dashboard", { replace: true });
      }

      setChecking(false);
    };

    check();
  }, [navigate]);

  // Show loading while checking
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
