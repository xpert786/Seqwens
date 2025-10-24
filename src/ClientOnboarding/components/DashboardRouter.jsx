import { useState, useEffect } from "react";
import DashboardFirst from "../pages/DashboardFirst";
import Dashboard from "../pages/Dashboard";
import { isNewUser } from "../utils/userUtils";

export default function DashboardRouter() {
  const [isNew, setIsNew] = useState(null); // null for loading state

  useEffect(() => {
    // Check user status on component mount
    setIsNew(isNewUser());
  }, []);

  // Show loading state while checking
  if (isNew === null) {
    return <div>Loading...</div>;
  }

  // Render appropriate component based on user status
  return isNew ? <DashboardFirst /> : <Dashboard />;
}


