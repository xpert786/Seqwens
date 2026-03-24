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
        const apiData = response.data || response;
        const onboardingCompleted = apiData.onboarding_completed;
        
        // If API says not completed, double check local storage as a fallback
        // This handles race conditions where backend hasn't updated yet
        if (!onboardingCompleted) {
          setIsNew(isNewUser());
        } else {
          setIsNew(false);
        }
      } catch (error) {
        console.error("Error fetching onboarding status:", error);
        // Fallback to local storage if API fails completely
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


