import { useState, useEffect } from "react";
import DashboardFirst from "../pages/DashboardFirst";
import Dashboard from "../pages/Dashboard";
import { isNewUser } from "../utils/userUtils";

export default function DashboardRouter() {
  const [isNew, setIsNew] = useState(null); // null for loading state

  useEffect(() => {
    // Check onboarding status from API
    const checkStatus = async () => {
      try {
        const { dashboardAPI } = await import('../utils/apiUtils');
        const response = await dashboardAPI.getOnboardingStatus();
        setIsNew(!response.onboarding_completed);
      } catch (error) {
        console.error("Error fetching onboarding status:", error);
        // Fallback to local storage if API fails
        setIsNew(isNewUser());
      }
    };

    checkStatus();
  }, []);

  // Show loading state while checking
  if (isNew === null) {
    return <div>Loading...</div>;
  }

  // Render appropriate component based on user status
  return isNew ? <DashboardFirst /> : <Dashboard />;
}


