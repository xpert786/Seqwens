import React, { useState } from "react";
import TaxHeader from "./TaxHeader";
import { Outlet } from "react-router-dom";
import "../styles/taxdashboardlayout.css";
import TaxSidebar from "./TaxSidebar";

export default function TaxDashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className={`tdl-layout ${isSidebarOpen ? "" : "tdl-collapsed"}`}>
      <TaxHeader
        onToggleSidebar={handleToggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />
      <TaxSidebar isSidebarOpen={isSidebarOpen} />
      <main className="tdl-main">
        <Outlet />
      </main>
    </div>
  );
}
