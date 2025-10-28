import React from 'react';
import { Outlet } from "react-router-dom";
import FirmHeader from './FirmHeader';
import FirmSidebar from './FirmSidebar';

export default function FirmDashboardLayout() {
  return (
    <div className="firm-dashboard-layout">
      <FirmHeader />
      <FirmSidebar />
      <main className="ml-[280px] mt-[70px] h-[calc(100vh-70px)] overflow-y-auto bg-[rgb(243,247,255)] p-2 w-[calc(100%-280px)] xl:ml-[280px] xl:w-[calc(100%-280px)] lg:ml-60 lg:w-[calc(100%-240px)] md:ml-60 md:w-[calc(100%-240px)]">
        <Outlet />
      </main>
    </div>
  );
}
