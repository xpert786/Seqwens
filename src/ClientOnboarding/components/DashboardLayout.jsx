import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";
import MaintenanceMode from "./MaintenanceMode";
import "../styles/DashboardLayout.css";

export default function DashboardLayout() {
  // Check if screen is mobile (less than 768px) and close sidebar by default on mobile
  const isMobileScreen = () => window.innerWidth < 768;
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobileScreen());

  useEffect(() => {
    // Handle window resize to close sidebar on mobile screens
    const handleResize = () => {
      if (isMobileScreen() && isSidebarOpen) {
        setIsSidebarOpen(false);
      } else if (!isMobileScreen() && !isSidebarOpen) {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (isSidebarOpen && isMobileScreen()) {
      const handleClickOutside = (event) => {
        const sidebar = document.querySelector('.client-sidebar-container');
        const toggleButton = document.querySelector('.sidebar-toggle-btn');
        
        if (
          sidebar &&
          !sidebar.contains(event.target) &&
          toggleButton &&
          !toggleButton.contains(event.target)
        ) {
          setIsSidebarOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSidebarOpen]);

  return (
    <div
      className={`dashboard-layout ${isSidebarOpen ? "" : "dashboard-collapsed"}`}
    >
      <MaintenanceMode />
      <Topbar
        onToggleSidebar={handleToggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />
      {/* Mobile overlay */}
      {isSidebarOpen && isMobileScreen() && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'absolute',
            top: '60px',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1040,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'auto'
          }}
        />
      )}
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        onLinkClick={() => setIsSidebarOpen(false)}
      />
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}

