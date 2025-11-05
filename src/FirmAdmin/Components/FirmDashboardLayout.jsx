import React, { useState, useEffect } from 'react';
import { Outlet } from "react-router-dom";
import FirmHeader from './FirmHeader';
import FirmSidebar from './FirmSidebar';

export default function FirmDashboardLayout() {
  const [sidebarWidth, setSidebarWidth] = useState('320px');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    // Listen for sidebar width changes from FirmSidebar
    const handleSidebarWidthChange = (event) => {
      setSidebarWidth(event.detail.width);
    };

    window.addEventListener('sidebarWidthChange', handleSidebarWidthChange);
    return () => window.removeEventListener('sidebarWidthChange', handleSidebarWidthChange);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="firm-dashboard-layout">
      <FirmHeader onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <FirmSidebar isSidebarOpen={isSidebarOpen} />
      <main 
        className="mt-[70px] h-[calc(100vh-70px)] overflow-y-auto bg-[rgb(243,247,255)] p-2 transition-all duration-300"
        style={{ 
          marginLeft: isSidebarOpen ? sidebarWidth : '0', 
          width: isSidebarOpen ? `calc(100% - ${sidebarWidth})` : '100%' 
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
