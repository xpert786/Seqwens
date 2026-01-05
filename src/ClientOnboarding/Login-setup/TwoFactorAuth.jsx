import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/TwoAuth.css";
import FixedLayout from "../components/FixedLayout";

export default function TwoFactorAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    // Automatically redirect users to their dashboard - skip email/phone verification
    // Check both localStorage and sessionStorage
    let userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const userType = localStorage.getItem('userType') || sessionStorage.getItem('userType');
        const roles = user.role || [];
        const customRole = user.custom_role;
        
        // Check if user has custom role and role is tax_preparer
        if (customRole && roles && Array.isArray(roles) && roles.includes('tax_preparer')) {
          navigate("/taxdashboard", { replace: true });
          return;
        }
        
        // Route based on user type
        if (userType === 'super_admin') {
          navigate("/superadmin", { replace: true });
        } else if (userType === 'support_admin' || userType === 'billing_admin') {
          navigate("/superadmin", { replace: true });
        } else if (userType === 'admin' || userType === 'firm') {
          // Check subscription plan first
          if (user.subscription_plan === null || user.subscription_plan === undefined) {
            navigate("/firmadmin/finalize-subscription", { replace: true });
          } else {
            navigate("/firmadmin", { replace: true });
          }
        } else if (userType === 'tax_preparer') {
          navigate("/taxdashboard", { replace: true });
        } else if (userType === 'client' || !userType) {
          // For clients, check completion status
          const isCompleted = user.is_completed;
          if (isCompleted) {
            navigate("/dashboard", { replace: true });
          } else {
            navigate("/dashboard-first", { replace: true });
          }
        } else {
          // Fallback to dashboard
          navigate("/dashboard", { replace: true });
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Fallback to dashboard
        navigate("/dashboard", { replace: true });
      }
    } else {
      // No user data, redirect to login
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <FixedLayout>
      <div className="twofa-container">
        <div className="twofa-boxs">
          <div className="twofa-content">
            <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "300px" }}>
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p style={{ 
                color: "#4B5563", 
                fontSize: "14px", 
                fontFamily: "BasisGrotesquePro",
                textAlign: "center"
              }}>
                Redirecting to your dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    </FixedLayout>
  );
}
