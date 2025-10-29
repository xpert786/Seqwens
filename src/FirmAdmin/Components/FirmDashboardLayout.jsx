import React, { useState, useEffect } from 'react';
import { Outlet } from "react-router-dom";
import FirmHeader from './FirmHeader';
import FirmSidebar from './FirmSidebar';

export default function FirmDashboardLayout() {
  const [sidebarWidth, setSidebarWidth] = useState('320px');

  useEffect(() => {
    // Listen for sidebar width changes from FirmSidebar
    const handleSidebarWidthChange = (event) => {
      setSidebarWidth(event.detail.width);
    };

    window.addEventListener('sidebarWidthChange', handleSidebarWidthChange);
    return () => window.removeEventListener('sidebarWidthChange', handleSidebarWidthChange);
  }, []);

  return (
    <div className="firm-dashboard-layout">
      <FirmHeader />
      <FirmSidebar />
      <main 
        className="mt-[70px] h-[calc(100vh-70px)] overflow-y-auto bg-[rgb(243,247,255)] p-2 transition-all duration-300"
        style={{ 
          marginLeft: sidebarWidth, 
          width: `calc(100% - ${sidebarWidth})` 
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
