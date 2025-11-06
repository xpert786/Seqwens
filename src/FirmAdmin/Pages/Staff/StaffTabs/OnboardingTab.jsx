import React from 'react';

export default function OnboardingTab({ onboardingSteps, trainingModules }) {
  return (
    <div className="space-y-6">
      {/* Onboarding Progress Card */}
      <div className="bg-white rounded-xl !border border-[#E8F0FF] p-6">
        {/* Heading (Outside the box) */}
        <div className="mb-2">
          <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro]">
            Onboarding Progress
          </h5>
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">
            Track completion status across all onboarding staff members
          </p>
        </div>

        {/* Progress Box */}
        <div className="bg-white rounded-xl !border border-[#E8F0FF] p-6">
          {/* Progress Info */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">
              Started 20-03-2024
            </span>
            <span className="text-xs text-gray-600 font-[BasisGrotesquePro]">
              65% complete
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full bg-gray-100 rounded-full h-3 mb-4">
            <div
              className="bg-[#3AD6F2] h-3 rounded-full transition-all duration-500"
              style={{ width: "65%" }}
            ></div>

            {/* Steps aligned to bar fill */}
            <div
              className="absolute top-5 left-0 flex justify-between w-[65%] text-xs text-gray-700 font-[BasisGrotesquePro]"
            >
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full border border-[#3AD6F2] flex items-center justify-center">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.25 2.25V5.25L7.25 6.25M10.25 5.25C10.25 8.01142 8.01142 10.25 5.25 10.25C2.48858 10.25 0.25 8.01142 0.25 5.25C0.25 2.48858 2.48858 0.25 5.25 0.25C8.01142 0.25 10.25 2.48858 10.25 5.25Z" stroke="#3AD6F2" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>

                </div>
                ID Verified
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full border border-[#3AD6F2] flex items-center justify-center">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.25 2.25V5.25L7.25 6.25M10.25 5.25C10.25 8.01142 8.01142 10.25 5.25 10.25C2.48858 10.25 0.25 8.01142 0.25 5.25C0.25 2.48858 2.48858 0.25 5.25 0.25C8.01142 0.25 10.25 2.48858 10.25 5.25Z" stroke="#3AD6F2" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>

                </div>
                Contract Signed
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full border border-[#3AD6F2] flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clip-path="url(#clip0_2624_1184)">
                      <path d="M4.99967 9.16536C7.30086 9.16536 9.16634 7.29988 9.16634 4.9987C9.16634 2.69751 7.30086 0.832031 4.99967 0.832031C2.69849 0.832031 0.833008 2.69751 0.833008 4.9987C0.833008 7.29988 2.69849 9.16536 4.99967 9.16536Z" stroke="#4B5563" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M6.25 3.75L3.75 6.25" stroke="#4B5563" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M3.75 3.75L6.25 6.25" stroke="#4B5563" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" />
                    </g>
                    <defs>
                      <clipPath id="clip0_2624_1184">
                        <rect width="10" height="10" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>

                </div>
                Training Done
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full border border-[#3AD6F2] flex items-center justify-center">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.25 2.25V5.25L7.25 6.25M10.25 5.25C10.25 8.01142 8.01142 10.25 5.25 10.25C2.48858 10.25 0.25 8.01142 0.25 5.25C0.25 2.48858 2.48858 0.25 5.25 0.25C8.01142 0.25 10.25 2.48858 10.25 5.25Z" stroke="#3AD6F2" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
                System Access
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full border border-[#3AD6F2] flex items-center justify-center">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.25 2.25V5.25L7.25 6.25M10.25 5.25C10.25 8.01142 8.01142 10.25 5.25 10.25C2.48858 10.25 0.25 8.01142 0.25 5.25C0.25 2.48858 2.48858 0.25 5.25 0.25C8.01142 0.25 10.25 2.48858 10.25 5.25Z" stroke="#3AD6F2" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
                Mentor Assigned
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-3 mt-3">
          {onboardingSteps.map((step) => (
            <div
              key={step.id}
              className="grid grid-cols-4 items-center !border border-[#E8F0FF] rounded-lg px-4 py-3 bg-white"
            >
              {/* 1️⃣ Column: Title + Subtitle */}
              <div className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">
                {step.title}
                {step.subtitle && (
                  <span className="text-gray-600 font-normal"> – {step.subtitle}</span>
                )}
              </div>

              {/* 2️⃣ Column: Status */}
              <div className="flex justify-center">
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full font-[BasisGrotesquePro] ${step.status === "Completed"
                    ? "bg-[#22C55E] text-white"
                    : step.status === "In Progress"
                      ? "bg-[#FBBF24] text-white"
                      : "bg-[#EF4444] text-white"
                    }`}
                >
                  {step.status}
                </span>
              </div>

              {/* 3️⃣ Column: Date */}
              <div className="text-xs text-[#3B4A66] font-[BasisGrotesquePro] text-center">
                {step.date ? step.date : "-"}
              </div>

              {/* 4️⃣ Column: Action Button */}
              <div className="flex justify-end">
                {step.action ? (
                  <button className="px-3 py-1 text-xs text-[#3B4A66] hover:bg-blue-50 rounded font-[BasisGrotesquePro] border border-blue-100">
                    {step.action}
                  </button>
                ) : (
                  <span className="text-xs text-[#3B4A66] font-[BasisGrotesquePro]">-</span>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training Modules */}
        <div className="bg-white !rounded-xl !border border-[#E8F0FF] p-6">
          <div className="mb-4">
            <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro]">Training Modules</h5>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">Available training programs and completion rates</p>
          </div>
          <div className="space-y-6">
            {trainingModules.map((module) => (
              <div key={module.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 font-[BasisGrotesquePro]">{module.title}</span>
                    {module.required && (
                      <span className="px-2 py-0.5 text-xs font-semibold !rounded-lg bg-[#EF4444] text-white font-[BasisGrotesquePro]">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 font-[BasisGrotesquePro]">{module.completed}/{module.total} completed</p>
                </div>
                <div className="w-full bg-gray-200 !rounded-full h-2">
                  <div
                    className="bg-[#3AD6F2] h-2 rounded-full"
                    style={{ width: `${(module.completed / module.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-xl !border border-[#E8F0FF] p-6">
          <h5 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]">Activity Timeline</h5>
          <div className="space-y-3">
            <div className="flex items-start gap-3">

              <div>
                <div className="font-medium text-gray-900 font-[BasisGrotesquePro]">Aug 10 - Invite Accepted</div>
              </div>
            </div>
            <div className="flex items-start gap-3">

              <div>
                <div className="font-medium text-gray-900 font-[BasisGrotesquePro]">Aug 12 - ID Verified</div>
              </div>
            </div>
            <div className="flex items-start gap-3">

              <div>
                <div className="font-medium text-gray-900 font-[BasisGrotesquePro]">Aug 15 - Training Module 1 Completed</div>
              </div>
            </div>
            <div className="flex items-start gap-3">

              <div>
                <div className="font-medium text-gray-900 font-[BasisGrotesquePro]">Aug 17 - Reminder Sent for E-Signature</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

