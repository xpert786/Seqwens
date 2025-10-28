import React, { useState } from 'react'
import SuperSidebar from '../Components/SuperSidebar'
import SuperHeader from '../Components/SuperHeader'
import { Outlet } from 'react-router-dom'
import { ModalProvider, useModal } from '../Context/ModalContext'

function SuperDashboardContent() {
  const {
    showRoleModal,
    roleName,
    setRoleName,
    selectedPrivileges,
    saveAsTemplate,
    setSaveAsTemplate,
    showPrivilegesDropdown,
    setShowPrivilegesDropdown,
    privileges,
    handleCloseRoleModal,
    handleSaveRole,
    togglePrivilege
  } = useModal();

  return (
    <>
      <div className="flex">
        <SuperHeader />
        <SuperSidebar />
        <main className="ml-[280px] mt-[70px] h-[calc(100vh-70px)] overflow-y-auto bg-[rgb(243,247,255)] p-2 w-[calc(100%-280px)] xl:ml-[280px] xl:w-[calc(100%-280px)] lg:ml-60 lg:w-[calc(100%-240px)] md:ml-60 md:w-[calc(100%-240px)]">
          <Outlet />
        </main>
      </div>

      {/* Add New Role Modal - At SuperDashboard level to cover entire page */}
      {showRoleModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999]" style={{backgroundColor: '#00000099'}}>
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4 shadow-xl">
            {/* Modal Header */}
            <h3 className="text-[#3B4A66] text-xl font-semibold font-[BasisGrotesquePro] mb-6">
              Add New Role
            </h3>

            {/* Role Name Input */}
            <div className="mb-4">
              <label className="block text-[#3B4A66] text-sm font-medium font-[BasisGrotesquePro] mb-2">
                Role Name
              </label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-[BasisGrotesquePro]"
                placeholder="Enter role name"
              />
            </div>

            {/* Assign Privileges Dropdown */}
            <div className="mb-4">
              <label className="block text-[#3B4A66] text-sm font-medium font-[BasisGrotesquePro] mb-2">
                Assign Privileges:
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowPrivilegesDropdown(!showPrivilegesDropdown)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-[BasisGrotesquePro] text-left flex justify-between items-center"
                >
                  <span className={selectedPrivileges.length === 0 ? "text-gray-500" : "text-gray-900"}>
                    {selectedPrivileges.length === 0 ? "Select role" : `${selectedPrivileges.length} privileges selected`}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showPrivilegesDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {privileges.map((privilege, index) => (
                      <div
                        key={index}
                        onClick={() => togglePrivilege(privilege)}
                        className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                          selectedPrivileges.includes(privilege) ? 'bg-blue-100 text-blue-800' : 'text-gray-900'
                        }`}
                      >
                        {privilege}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Save as Template Toggle */}
            <div className="mb-6 flex items-center justify-between">
              <label className="text-[#3B4A66] text-sm font-medium font-[BasisGrotesquePro]">
                Save as Template
              </label>
              <div 
                className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
                  saveAsTemplate ? 'bg-orange-500' : 'bg-gray-300'
                }`}
                onClick={() => setSaveAsTemplate(!saveAsTemplate)}
              >
                <div 
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-sm ${
                    saveAsTemplate ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCloseRoleModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-md text-sm font-medium font-[BasisGrotesquePro] hover:bg-gray-600 transition-colors"
      style={{borderRadius: '7px'}}
      >
                Cancel
              </button>
              <button
                onClick={handleSaveRole}
                className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-medium font-[BasisGrotesquePro] hover:bg-orange-600 transition-colors"
              style={{borderRadius: '7px'}}
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SuperDashboard() {
  return (
    <ModalProvider>
      <SuperDashboardContent />
    </ModalProvider>
  )
}

export default SuperDashboard;
