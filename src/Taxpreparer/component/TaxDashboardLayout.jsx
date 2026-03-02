import React, { useState, useEffect } from "react";
import TaxHeader from "./TaxHeader";
import { Outlet } from "react-router-dom";
import MaintenanceMode from "../../ClientOnboarding/components/MaintenanceMode";
import "../styles/taxdashboardlayout.css";
import TaxSidebar from "./TaxSidebar";
import ForcedPasswordChangeModal from "../../components/ForcedPasswordChangeModal";
import ImpersonationBanner from "../../FirmAdmin/Components/ImpersonationBanner";

import { getImpersonationStatus } from "../../ClientOnboarding/utils/userUtils";

export default function TaxDashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);


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



  // Check impersonation status periodically
  useEffect(() => {
    const checkStatus = () => {
      const { isImpersonating: impersonating } = getImpersonationStatus();
      setIsImpersonating(impersonating);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className={`tdl-layout ${isSidebarOpen ? "" : "tdl-collapsed"}`}>
      <MaintenanceMode />
      <ImpersonationBanner />
      <ForcedPasswordChangeModal />

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
      <TaxSidebar
        isSidebarOpen={isSidebarOpen}
        onNavigate={handleCloseSidebar}
        isImpersonating={isImpersonating}
      />
      <main
        className="tdl-main"
        style={{
          marginTop: isImpersonating ? '110px' : '70px',
          height: isImpersonating ? 'calc(100vh - 110px)' : 'calc(100vh - 70px)'
        }}
      >

        <Outlet />
      </main>
    </div>
  );
}
