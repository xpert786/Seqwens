import React from 'react';

export default function AdvancedTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Templates */}
        <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
          <div className="mb-5">
            <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
              Document Templates
            </h5>
            <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
              Manage document templates and formats
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h6 className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro] mb-2">
                Invoice Template
              </h6>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 pr-8 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white appearance-none">
                    <option>Standard Template</option>
                    <option>Professional</option>
                    <option>Minimal</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 5L6 8L9 5" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <button className="p-2 text-[#1F2A55] hover:bg-gray-50 !rounded-lg !border border-[#E8F0FF] transition bg-white flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 9C1.5 9 3.75 3.75 9 3.75C14.25 3.75 16.5 9 16.5 9C16.5 9 14.25 14.25 9 14.25C3.75 14.25 1.5 9 1.5 9Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <h6 className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro] mb-2">
                Letter Template
              </h6>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 pr-8 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white appearance-none">
                    <option>Professional</option>
                    <option>Standard Template</option>
                    <option>Minimal</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 5L6 8L9 5" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <button className="p-2 text-[#1F2A55] hover:bg-gray-50 !rounded-lg !border border-[#E8F0FF] transition bg-white flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 9C1.5 9 3.75 3.75 9 3.75C14.25 3.75 16.5 9 16.5 9C16.5 9 14.25 14.25 9 14.25C3.75 14.25 1.5 9 1.5 9Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <h6 className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro] mb-2">
                Report Template
              </h6>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 pr-8 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white appearance-none">
                    <option>Detailed</option>
                    <option>Standard Template</option>
                    <option>Professional</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 5L6 8L9 5" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <button className="p-2 text-[#1F2A55] hover:bg-gray-50 !rounded-lg !border border-[#E8F0FF] transition bg-white flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 9C1.5 9 3.75 3.75 9 3.75C14.25 3.75 16.5 9 16.5 9C16.5 9 14.25 14.25 9 14.25C3.75 14.25 1.5 9 1.5 9Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
          <div className="mb-5">
            <h6 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
              Data Management
            </h6>
            <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
              Configure data retention and backup settings
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <label className="block text-[16px] font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-1">
                  Staff Access Level
                </label>
                <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
                  Default permissions for new staff
                </p>
              </div>
              <div className="relative flex-shrink-0 min-w-[150px]">
                <select className="!rounded-lg !border border-[#E8F0FF] px-3 py-2 pr-8 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white appearance-none w-full">
                  <option>Standard</option>
                  <option>Limited</option>
                  <option>Full Access</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 5L6 8L9 5" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <label className="block text-[16px] font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-1">
                  Client Data Access
                </label>
                <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
                  Who can view client information
                </p>
              </div>
              <div className="relative flex-shrink-0 min-w-[150px]">
                <select className="!rounded-lg !border border-[#E8F0FF] px-3 py-2 pr-8 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white appearance-none w-full">
                  <option>Assigned</option>
                  <option>All Staff</option>
                  <option>Managers Only</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 5L6 8L9 5" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <label className="block text-[16px] font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-1">
                  Financial Data Access
                </label>
                <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
                  Who can view financial information
                </p>
              </div>
              <div className="relative flex-shrink-0 min-w-[150px]">
                <select className="!rounded-lg !border border-[#E8F0FF] px-3 py-2 pr-8 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white appearance-none w-full">
                  <option>Managers</option>
                  <option>All Staff</option>
                  <option>Assigned Only</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 5L6 8L9 5" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
        <div className="mb-5">
          <h5 className="text-lg font-semibold !text-[#EF4444] font-[BasisGrotesquePro] mb-1">
            Danger Zone
          </h5>
          <p className="text-[15px] text-[#4B5563] font-regular font-[BasisGrotesquePro]">
            Irreversible and destructive actions
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between p-4 bg-[#EF444417] !rounded-lg !border border-[#EF4444]">
            <div className="flex-1">
              <h6 className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
                Staff Access Level
              </h6>
              <p className="text-xs text-[#4B5563] font-regular font-[BasisGrotesquePro]">
                Default permissions for new staff
              </p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-white bg-[#EF4444] !rounded-lg hover:bg-red-700 transition font-[BasisGrotesquePro] flex-shrink-0">
              Standard
            </button>
          </div>

          <div className="flex items-start justify-between p-4 bg-[#EF444417] !rounded-lg !border border-[#EF4444]">
            <div className="flex-1">
              <h6 className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
                Delete Firm Account
              </h6>
              <p className="text-xs text-[#4B5563] font-regular font-[BasisGrotesquePro]">
                Permanently delete your firm account and all data
              </p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-white bg-[#EF4444] !rounded-lg hover:bg-red-700 transition font-[BasisGrotesquePro] flex-shrink-0">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

