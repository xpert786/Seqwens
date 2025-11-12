import React, { useState } from 'react';

export default function IntegrationsTab() {
  const [preferences, setPreferences] = useState({
    clientPortal: true,
    emailNotifications: true,
    workflowAutomation: true,
    advancedReporting: true
  });

  const togglePreference = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* System Preferences */}
      <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
        <div className="mb-5">
          <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
            System Preferences
          </h5>
          <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
            Configure system-wide settings
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro]">
                Client Portal Access
              </h5>
              <p className="text-sm text-[#4B5563] font-[BasisGrotesquePro]">
                Allow clients to access their portal
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center flex-shrink-0">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={preferences.clientPortal}
                onChange={() => togglePreference('clientPortal')}
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${preferences.clientPortal ? 'bg-[#F56D2D]' : 'bg-gray-300'
                }`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${preferences.clientPortal ? 'translate-x-5' : 'translate-x-0'
                  }`} />
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro]">
                Email Notifications
              </h5>
              <p className="text-sm text-[#4B5563] font-[BasisGrotesquePro]">
                Send automated email notifications
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center flex-shrink-0">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={preferences.emailNotifications}
                onChange={() => togglePreference('emailNotifications')}
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${preferences.emailNotifications ? 'bg-[#F56D2D]' : 'bg-gray-300'
                }`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${preferences.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`} />
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro]">
                Workflow Automation
              </h5>
              <p className="text-sm text-[#4B5563] font-[BasisGrotesquePro]">
                Enable automated workflows
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center flex-shrink-0">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={preferences.workflowAutomation}
                onChange={() => togglePreference('workflowAutomation')}
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${preferences.workflowAutomation ? 'bg-[#F56D2D]' : 'bg-gray-300'
                }`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${preferences.workflowAutomation ? 'translate-x-5' : 'translate-x-0'
                  }`} />
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro]">
                Advanced Reporting
              </h5>
              <p className="text-sm text-[#4B5563] font-[BasisGrotesquePro]">
                Generate detailed reports
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center flex-shrink-0">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={preferences.advancedReporting}
                onChange={() => togglePreference('advancedReporting')}
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${preferences.advancedReporting ? 'bg-[#F56D2D]' : 'bg-gray-300'
                }`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${preferences.advancedReporting ? 'translate-x-5' : 'translate-x-0'
                  }`} />
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
        <div className="mb-5">
          <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
            Data Management
          </h5>
          <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
            Configure data retention and backup settings
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Data Retention (years)
            </label>
            <select className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white">
              <option>7 years</option>
              <option>5 years</option>
              <option>10 years</option>
              <option>15 years</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Backup Frequency
            </label>
            <select className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white">
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <button className="w-full px-4 py-2 text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25M5.25 7.5L9 11.25M9 11.25L12.75 7.5M9 11.25V2.25" stroke="#4B5563" stroke-linecap="round" stroke-linejoin="round" />
              </svg>

              Download Data Export
            </button>
            <button className="w-full px-4 py-2 text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] flex items-center justify-center gap-2 mt-3">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M12.75 6L9 2.25L5.25 6" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M9 2.25V11.25" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
              </svg>

              Import Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

