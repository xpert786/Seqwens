import React from 'react'
import SuperSidebar from '../Components/SuperSidebar'
import SuperHeader from '../Components/SuperHeader'
import { Outlet } from 'react-router-dom'

function SuperDashboard() {
  return (
    <div className="flex">
      <SuperHeader />
      <SuperSidebar />
      <main className="ml-[280px] mt-[70px] h-[calc(100vh-70px)] overflow-y-auto bg-[rgb(243,247,255)] p-2 w-[calc(100%-280px)] xl:ml-[280px] xl:w-[calc(100%-280px)] lg:ml-60 lg:w-[calc(100%-240px)] md:ml-60 md:w-[calc(100%-240px)]">
        <Outlet />
      </main>
    </div>
  )
}

export default SuperDashboard;
