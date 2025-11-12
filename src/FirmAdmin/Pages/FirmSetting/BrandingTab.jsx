import React, { useState } from 'react';

export default function BrandingTab() {
  const [primaryColor, setPrimaryColor] = useState('#1E40AF');
  const [secondaryColor, setSecondaryColor] = useState('#22C55E');
  const [accentColor, setAccentColor] = useState('#F56D2D');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo & Assets */}
        <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
          <div className="mb-5">
            <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
              Logo & Assets
            </h5>
            <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
              Upload your firm's visual assets
            </p>
          </div>

          <div className="space-y-6">
            {/* Firm Logo */}
            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                Firm Logo
              </label>
              <div className="flex items-center gap-4">
                <div className=" flex items-center justify-center">
                  <svg width="80" height="80" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0.5" y="0.5" width="69" height="69" rx="9.5" fill="#E8F0FF" />
                    <rect x="0.5" y="0.5" width="69" height="69" rx="9.5" stroke="#E8F0FF" />
                    <path d="M26.5 49.1693V23.6693C26.5 22.9178 26.7985 22.1972 27.3299 21.6658C27.8612 21.1344 28.5819 20.8359 29.3333 20.8359H40.6667C41.4181 20.8359 42.1388 21.1344 42.6701 21.6658C43.2015 22.1972 43.5 22.9178 43.5 23.6693V49.1693H26.5Z" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M26.5002 35H23.6668C22.9154 35 22.1947 35.2985 21.6634 35.8299C21.132 36.3612 20.8335 37.0819 20.8335 37.8333V46.3333C20.8335 47.0848 21.132 47.8054 21.6634 48.3368C22.1947 48.8682 22.9154 49.1667 23.6668 49.1667H26.5002" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M43.5 30.75H46.3333C47.0848 30.75 47.8054 31.0485 48.3368 31.5799C48.8682 32.1112 49.1667 32.8319 49.1667 33.5833V46.3333C49.1667 47.0848 48.8682 47.8054 48.3368 48.3368C47.8054 48.8682 47.0848 49.1667 46.3333 49.1667H43.5" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M32.1665 26.5H37.8332" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M32.1665 32.1641H37.8332" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M32.1665 37.8359H37.8332" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M32.1665 43.5H37.8332" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>

                </div>
                <div className="flex flex-col gap-2">
                  <button className="px-4 py-2 text-sm font-medium text-[#3B4A66] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-[#E8F0FF] font-[BasisGrotesquePro] flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.25 8.75V11.0833C12.25 11.3928 12.1271 11.6895 11.9083 11.9083C11.6895 12.1271 11.3928 12.25 11.0833 12.25H2.91667C2.60725 12.25 2.3105 12.1271 2.09171 11.9083C1.87292 11.6895 1.75 11.3928 1.75 11.0833V8.75" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M9.91683 4.66667L7.00016 1.75L4.0835 4.66667" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M7 1.75V8.75" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>

                    Upload Logo
                  </button>
                  <p className="text-xs text-[#4B5563] font-regular font-[BasisGrotesquePro]">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>

            {/* Favicon */}
            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                Favicon
              </label>
              <div className="flex items-center gap-4">
                <div className=" flex items-center justify-center">
                  <svg width="50" height="50" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0.5" y="0.5" width="29" height="29" rx="14.5" fill="#E8F0FF" />
                    <rect x="0.5" y="0.5" width="29" height="29" rx="14.5" stroke="#E8F0FF" />
                    <g clip-path="url(#clip0_2455_972)">
                      <path d="M11.4998 20.8307V10.3307C11.4998 10.0213 11.6228 9.72456 11.8415 9.50577C12.0603 9.28698 12.3571 9.16406 12.6665 9.16406H17.3332C17.6426 9.16406 17.9393 9.28698 18.1581 9.50577C18.3769 9.72456 18.4998 10.0213 18.4998 10.3307V20.8307M11.4998 20.8307H18.4998M11.4998 20.8307H10.3332C10.0238 20.8307 9.72701 20.7078 9.50821 20.489C9.28942 20.2702 9.1665 19.9735 9.1665 19.6641V16.1641C9.1665 15.8546 9.28942 15.5579 9.50821 15.3391C9.72701 15.1203 10.0238 14.9974 10.3332 14.9974H11.4998M18.4998 20.8307L19.6665 20.8307C19.9759 20.8307 20.2727 20.7078 20.4915 20.489C20.7103 20.2702 20.8332 19.9735 20.8332 19.6641V14.4141C20.8332 14.1046 20.7103 13.8079 20.4915 13.5891C20.2727 13.3703 19.9759 13.2474 19.6665 13.2474H18.4998M13.8332 11.4974H16.1665M13.8332 13.8307H16.1665M13.8332 16.1641H16.1665M13.8332 18.4974H16.1665" stroke="#3AD6F2" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round" />
                    </g>
                    <defs>
                      <clipPath id="clip0_2455_972">
                        <rect width="14" height="14" fill="white" transform="translate(8 8)" />
                      </clipPath>
                    </defs>
                  </svg>

                </div>
                <div className="flex flex-col gap-2">
                  <button className="px-4 py-2 text-sm font-medium text-[#3B4A66] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-[#E8F0FF] transition font-[BasisGrotesquePro] flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.25 8.75V11.0833C12.25 11.3928 12.1271 11.6895 11.9083 11.9083C11.6895 12.1271 11.3928 12.25 11.0833 12.25H2.91667C2.60725 12.25 2.3105 12.1271 2.09171 11.9083C1.87292 11.6895 1.75 11.3928 1.75 11.0833V8.75" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M9.91683 4.66667L7.00016 1.75L4.0835 4.66667" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M7 1.75V8.75" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>

                    Upload Favicon
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Color Scheme */}
        <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
          <div className="mb-5">
            <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
              Color Scheme
            </h5>
            <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
              Customize your firm's color palette
            </p>
          </div>

          <div className="space-y-4">
            {/* Color Options - Horizontal Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative rounded-lg !border border-[#E8F0FF] p-1 flex-shrink-0">
                    <div
                      className="w-12 h-8 sm:w-14 h-8 !rounded-lg cursor-pointer"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 min-w-[100px] sm:min-w-[120px] rounded-lg !border border-[#E8F0FF] bg-white">
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro] bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative rounded-lg !border border-[#E8F0FF] p-1 flex-shrink-0">
                    <div
                      className="w-12 h-8 sm:w-14 h-8 !rounded-md cursor-pointer"
                      style={{ backgroundColor: secondaryColor }}
                    />
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 min-w-[100px] sm:min-w-[120px] rounded-lg !border border-[#E8F0FF] bg-white">
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-full rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro] bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 2xl:col-span-1">
                <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative rounded-lg !border border-[#E8F0FF] p-1 flex-shrink-0">
                    <div
                      className="w-12 h-8 sm:w-14 h-8 !rounded-md cursor-pointer"
                      style={{ backgroundColor: accentColor }}
                    />
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 min-w-[100px] sm:min-w-[100px] max-w-[100px] md:max-w-[150px] 2xl:max-w-none rounded-lg !border border-[#E8F0FF] bg-white">
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-full rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro] bg-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                Font Family
              </label>
              <select className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none cursor-pointer font-[BasisGrotesquePro]">
                <option>Inter</option>
                <option>Roboto</option>
                <option>Open Sans</option>
                <option>Lato</option>
              </select>
            </div>

            <button className="w-full px-4 py-2 text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.5 9C1.5 9 3.75 3.75 9 3.75C14.25 3.75 16.5 9 16.5 9C16.5 9 14.25 14.25 9 14.25C3.75 14.25 1.5 9 1.5 9Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
              </svg>

              Preview Changes
            </button>
          </div>
        </div>
      </div>

      {/* Portal Login Preview */}
      <div className="bg-white rounded-2xl p-3 !border border-[#E8F0FF]">
        <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-5">
          Portal Login Preview
        </h5>

        <div className="bg-white rounded-lg p-2">
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2.5 text-sm text-[#3B4A66] font-regular placeholder:text-[#3B4A66] focus:outline-none font-[BasisGrotesquePro] bg-white"
            />
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full rounded-lg !border border-[#E8F0FF] px-3 py-2.5 text-sm text-[#3B4A66] font-regular placeholder:text-[#3B4A66] focus:outline-none font-[BasisGrotesquePro] bg-white mt-3"
            />
          </div>
        </div>
      </div>

      {/* Customize Login Fields */}
      <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
        <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-5">
          Customize Login Fields
        </h5>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button className="px-4 py-2.5 text-sm font-medium text-[#3B4A66] bg-white !border border-[#E8F0FF] !rounded-lg font-[BasisGrotesquePro] w-28 flex-shrink-0">
              Email
            </button>
            <div className="relative flex-1 min-w-[150px]">
              <select className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2.5 pr-10 text-sm text-[#3B4A66] focus:outline-none cursor-pointer font-[BasisGrotesquePro] bg-white appearance-none">
                <option>Email</option>
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Enter your email"
              className="flex-1 min-w-[200px] !rounded-lg !border border-[#E8F0FF] px-3 py-2.5 text-sm text-[#3B4A66] font-regular placeholder:text-[#3B4A66] focus:outline-none font-[BasisGrotesquePro] bg-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2.5 text-sm font-medium text-[#3B4A66] bg-white !border border-[#E8F0FF] !rounded-lg font-[BasisGrotesquePro] w-28 flex-shrink-0">
              Password
            </button>
            <div className="relative flex-1 min-w-[150px]">
              <select className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2.5 pr-10 text-sm text-[#3B4A66] focus:outline-none cursor-pointer font-[BasisGrotesquePro] bg-white appearance-none">
                <option>Password</option>
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="#3B4A66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Enter your password"
              className="flex-1 min-w-[200px] !rounded-lg !border border-[#E8F0FF] px-3 py-2.5 text-sm text-[#3B4A66] font-regular placeholder:text-[#3B4A66] focus:outline-none font-[BasisGrotesquePro] bg-white"
            />
          </div>

          <button className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] !rounded-lg hover:bg-[#FF7142] transition font-[BasisGrotesquePro] flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3V13M3 8H13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Add Field
          </button>
        </div>
      </div>

      {/* Custom Domain and White-Label */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
          <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-4">
            Custom Domain
          </h5>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="portal.myfirm.com"
              className="flex-1 !rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#3B4A66] font-regular placeholder:text-gray-400 focus:outline-none font-[BasisGrotesquePro] bg-white"
            />
            <button className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] !rounded-lg hover:bg-[#FF7142] transition font-[BasisGrotesquePro]">
              Save
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
          <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-4">
            White-Label Mode
          </h5>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-5 h-4 !rounded-lg !border border-[#3AD6F2] bg-white focus:outline-none" />
            <span className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro] ml-3">
              Enable White-Label for multi-office use
            </span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-start gap-3">
        <button className="px-4 py-2 text-sm font-medium text-[#131323] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]">
          Reset Branding
        </button>
        <button className="px-4 py-2 text-sm font-medium text-white !bg-[#F56D2D] !rounded-lg  font-[BasisGrotesquePro]">
          Apply to All Offices
        </button>
      </div>
    </div>
  );
}

