import React, { useState, useEffect } from "react";
import TaxHeader from "./TaxHeader";
import { Outlet } from "react-router-dom";
import MaintenanceMode from "../../ClientOnboarding/components/MaintenanceMode";
import "../styles/taxdashboardlayout.css";
import TaxSidebar from "./TaxSidebar";

export default function TaxDashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile/tablet size
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      // On mobile, sidebar should be closed by default
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isSidebarOpen]);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleCloseSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className={`tdl-layout ${isSidebarOpen ? "" : "tdl-collapsed"}`}>
      <MaintenanceMode />
      <TaxHeader
        onToggleSidebar={handleToggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />
      {/* Overlay for mobile/tablet */}
      {isMobile && isSidebarOpen && (
        <div 
          className="tsb-overlay show" 
          onClick={handleCloseSidebar}
          aria-hidden="true"
        />
      )}
      <TaxSidebar isSidebarOpen={isSidebarOpen} />
      <main className="tdl-main">
        <Outlet />
      </main>
    </div>
  );
}
