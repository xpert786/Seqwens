import { useState } from "react";

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState("monthly");

  return (
    <section className="py-20 px-6 ">
      <div className="max-w-9xl mx-auto bg-[#FFF4E6]  rounded-3xl p-14 md:p-20 relative overflow-visible">
        

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-gray-500 text-sm mb-3">Pricing</p>
          <h2 className="text-4xl font-bold text-[#3B4A66]">
            SIMPLE, TRANSPARENT <span className="text-[#FF9D28]">PRICING</span>
          </h2>
          <p className="text-gray-600 mt-4 text-base">
            Choose the perfect plan for your practice. All plans include a 14-day free trial.
          </p>

          {/* Toggle Buttons */}
          <div className="flex justify-center mt-8">
            <div className="bg-white !rounded-xl p-1.5 inline-flex gap-1 shadow-sm">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 !rounded-lg text-sm font-semibold transition-colors ${billingCycle === "monthly"
                  ? "bg-[#F56D2D] text-white"
                  : "bg-transparent text-gray-600 hover:text-[#F56D2D]"
                  }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-2 !rounded-lg text-sm font-semibold transition-colors ${billingCycle === "yearly"
                  ? "bg-[#F56D2D] text-white"
                  : "bg-transparent text-gray-600 hover:text-[#F56D2D]"
                  }`}
              >
                Yearly (Save 17%)
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12 items-stretch">

          {/* SOLO Plan */}
          <div className="bg-white rounded-2xl p-8 shadow-lg relative flex flex-col h-full">
            <h3 className="text-xl font-bold text-[#3B4A66]">SOLO</h3>
            <p className="text-gray-500 text-sm mt-1">Perfect for solo tax professionals</p>

            <div className="mt-6">
              <span className="text-5xl font-bold !text-[#F49C2D]">$49</span>
              <span className="text-gray-500 text-sm ml-2">/month</span>
            </div>

            {/* Stats */}
            <div className="mt-6 space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.6666 19.25V17.4167C14.6666 16.4442 14.2803 15.5116 13.5926 14.8239C12.905 14.1363 11.9724 13.75 10.9999 13.75H5.49992C4.52746 13.75 3.59483 14.1363 2.90719 14.8239C2.21956 15.5116 1.83325 16.4442 1.83325 17.4167V19.25M20.1666 19.25V17.4167C20.166 16.6043 19.8956 15.815 19.3978 15.173C18.9001 14.5309 18.2032 14.0723 17.4166 13.8692M14.6666 2.86917C15.4553 3.07111 16.1544 3.52981 16.6536 4.17295C17.1528 4.81609 17.4238 5.60709 17.4238 6.42125C17.4238 7.23541 17.1528 8.02641 16.6536 8.66955C16.1544 9.31269 15.4553 9.77139 14.6666 9.97333M11.9166 6.41667C11.9166 8.44171 10.275 10.0833 8.24992 10.0833C6.22487 10.0833 4.58325 8.44171 4.58325 6.41667C4.58325 4.39162 6.22487 2.75 8.24992 2.75C10.275 2.75 11.9166 4.39162 11.9166 6.41667Z" stroke="#4B5563" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>

                <span>1 User</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.6666 19.25V17.4167C14.6666 16.4442 14.2803 15.5116 13.5926 14.8239C12.905 14.1363 11.9724 13.75 10.9999 13.75H5.49992C4.52746 13.75 3.59483 14.1363 2.90719 14.8239C2.21956 15.5116 1.83325 16.4442 1.83325 17.4167V19.25M14.6666 10.0833L16.4999 11.9167L20.1666 8.25M11.9166 6.41667C11.9166 8.44171 10.275 10.0833 8.24992 10.0833C6.22487 10.0833 4.58325 8.44171 4.58325 6.41667C4.58325 4.39162 6.22487 2.75 8.24992 2.75C10.275 2.75 11.9166 4.39162 11.9166 6.41667Z" stroke="#4B5563" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>

                <span>100 Clients</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.0417 17.4163H8.24998C7.06003 17.416 5.89359 17.0848 4.88103 16.4598C3.86847 15.8347 3.04966 14.9404 2.51612 13.8767C1.98257 12.8131 1.7553 11.622 1.85971 10.4367C1.96412 9.25131 2.39609 8.11832 3.10734 7.16433C3.8186 6.21033 4.78113 5.4729 5.88737 5.03445C6.99361 4.59601 8.19997 4.47381 9.37166 4.68152C10.5434 4.88923 11.6342 5.41866 12.5223 6.21065C13.4104 7.00264 14.0608 8.02599 14.4008 9.16634H16.0417C17.1357 9.16634 18.1849 9.60094 18.9585 10.3745C19.7321 11.1481 20.1667 12.1973 20.1667 13.2913C20.1667 14.3854 19.7321 15.4346 18.9585 16.2082C18.1849 16.9817 17.1357 17.4163 16.0417 17.4163Z" stroke="#4B5563" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>

                <span>5 GB Storage</span>
              </div>
            </div>

            <hr className="my-6 border-gray-200" />

            {/* Features */}
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke="#22C55E" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>

                <span>Secure Client Portal</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke="#22C55E" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>

                <span>Document Upload & Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke="#22C55E" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>

                <span>Basic Task Management</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke="#22C55E" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>

                <span>Secure Messaging</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke="#22C55E" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>

                <span>Email Alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke="#22C55E" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>

                <span>Data Export</span>
              </div>
            </div>

            <button className="w-full mt-auto bg-[#F56D2D] text-white py-2 !rounded-xl font-semibold hover:bg-[#E55D1D] transition-colors">
              Start Free Trial
            </button>
          </div>

          {/* TEAM Plan - Most Popular */}
          <div className="bg-[#00C0C6] rounded-2xl p-8 shadow-xl relative flex flex-col h-full">
            {/* Most Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-white text-[#3B4A66] px-3 py-2 rounded-full text-xs font-bold">
              Most Popular
            </div>

            <h3 className="text-xl font-bold text-white">TEAM</h3>
            <p className="text-white/80 text-sm mt-1">Ideal for small firms (2-10 staff)</p>

            <div className="mt-6">
              <span className="text-5xl font-bold text-white">$149</span>
              <span className="text-white/80 text-sm ml-2">/month</span>
            </div>

            {/* Stats */}
            <div className="mt-6 space-y-3 text-sm text-white/90">
              <div className="flex items-center gap-2">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.6666 19.25V17.4167C14.6666 16.4442 14.2803 15.5116 13.5926 14.8239C12.905 14.1363 11.9724 13.75 10.9999 13.75H5.49992C4.52746 13.75 3.59483 14.1363 2.90719 14.8239C2.21956 15.5116 1.83325 16.4442 1.83325 17.4167V19.25M20.1666 19.25V17.4167C20.166 16.6043 19.8956 15.815 19.3978 15.173C18.9001 14.5309 18.2032 14.0723 17.4166 13.8692M14.6666 2.86917C15.4553 3.07111 16.1544 3.52981 16.6536 4.17295C17.1528 4.81609 17.4238 5.60709 17.4238 6.42125C17.4238 7.23541 17.1528 8.02641 16.6536 8.66955C16.1544 9.31269 15.4553 9.77139 14.6666 9.97333M11.9166 6.41667C11.9166 8.44171 10.275 10.0833 8.24992 10.0833C6.22487 10.0833 4.58325 8.44171 4.58325 6.41667C4.58325 4.39162 6.22487 2.75 8.24992 2.75C10.275 2.75 11.9166 4.39162 11.9166 6.41667Z" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>Up to 10 Users</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.6666 19.25V17.4167C14.6666 16.4442 14.2803 15.5116 13.5926 14.8239C12.905 14.1363 11.9724 13.75 10.9999 13.75H5.49992C4.52746 13.75 3.59483 14.1363 2.90719 14.8239C2.21956 15.5116 1.83325 16.4442 1.83325 17.4167V19.25M14.6666 10.0833L16.4999 11.9167L20.1666 8.25M11.9166 6.41667C11.9166 8.44171 10.275 10.0833 8.24992 10.0833C6.22487 10.0833 4.58325 8.44171 4.58325 6.41667C4.58325 4.39162 6.22487 2.75 8.24992 2.75C10.275 2.75 11.9166 4.39162 11.9166 6.41667Z" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>500 Clients</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.0417 17.4163H8.24998C7.06003 17.416 5.89359 17.0848 4.88103 16.4598C3.86847 15.8347 3.04966 14.9404 2.51612 13.8767C1.98257 12.8131 1.7553 11.622 1.85971 10.4367C1.96412 9.25131 2.39609 8.11832 3.10734 7.16433C3.8186 6.21033 4.78113 5.4729 5.88737 5.03445C6.99361 4.59601 8.19997 4.47381 9.37166 4.68152C10.5434 4.88923 11.6342 5.41866 12.5223 6.21065C13.4104 7.00264 14.0608 8.02599 14.4008 9.16634H16.0417C17.1357 9.16634 18.1849 9.60094 18.9585 10.3745C19.7321 11.1481 20.1667 12.1973 20.1667 13.2913C20.1667 14.3854 19.7321 15.4346 18.9585 16.2082C18.1849 16.9817 17.1357 17.4163 16.0417 17.4163Z" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>50 GB Storage</span>
              </div>
            </div>

            <hr className="my-6 border-white/20" />

            {/* Features */}
            <div className="space-y-3 text-sm text-white">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>Everything in Solo</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>E-Signature Requests (100/month)</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>Custom Folder Templates</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>Standard Workflow Automation</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>Role-Based Access Control</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>Priority Email Support</span>
              </div>
            </div>

            <button className="w-full mt-auto bg-white text-[#3B4A66] py-2 !rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              Start Free Trial
            </button>
          </div>

          {/* ENTERPRISE Plan */}
          <div className="bg-[#3B4A66] rounded-2xl p-8 shadow-lg relative text-white flex flex-col h-full">
            <h3 className="text-xl font-bold">ENTERPRISE</h3>
            <p className="text-white/70 text-sm mt-1">For large practices (25+ staff)</p>

            <div className="mt-6">
              <span className="text-5xl font-bold">CUSTOM</span>
            </div>

            {/* Stats */}
            <div className="mt-6 space-y-3 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.6666 19.25V17.4167C14.6666 16.4442 14.2803 15.5116 13.5926 14.8239C12.905 14.1363 11.9724 13.75 10.9999 13.75H5.49992C4.52746 13.75 3.59483 14.1363 2.90719 14.8239C2.21956 15.5116 1.83325 16.4442 1.83325 17.4167V19.25M20.1666 19.25V17.4167C20.166 16.6043 19.8956 15.815 19.3978 15.173C18.9001 14.5309 18.2032 14.0723 17.4166 13.8692M14.6666 2.86917C15.4553 3.07111 16.1544 3.52981 16.6536 4.17295C17.1528 4.81609 17.4238 5.60709 17.4238 6.42125C17.4238 7.23541 17.1528 8.02641 16.6536 8.66955C16.1544 9.31269 15.4553 9.77139 14.6666 9.97333M11.9166 6.41667C11.9166 8.44171 10.275 10.0833 8.24992 10.0833C6.22487 10.0833 4.58325 8.44171 4.58325 6.41667C4.58325 4.39162 6.22487 2.75 8.24992 2.75C10.275 2.75 11.9166 4.39162 11.9166 6.41667Z" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>Unlimited Users</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.6666 19.25V17.4167C14.6666 16.4442 14.2803 15.5116 13.5926 14.8239C12.905 14.1363 11.9724 13.75 10.9999 13.75H5.49992C4.52746 13.75 3.59483 14.1363 2.90719 14.8239C2.21956 15.5116 1.83325 16.4442 1.83325 17.4167V19.25M14.6666 10.0833L16.4999 11.9167L20.1666 8.25M11.9166 6.41667C11.9166 8.44171 10.275 10.0833 8.24992 10.0833C6.22487 10.0833 4.58325 8.44171 4.58325 6.41667C4.58325 4.39162 6.22487 2.75 8.24992 2.75C10.275 2.75 11.9166 4.39162 11.9166 6.41667Z" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>Unlimited Clients</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.0417 17.4163H8.24998C7.06003 17.416 5.89359 17.0848 4.88103 16.4598C3.86847 15.8347 3.04966 14.9404 2.51612 13.8767C1.98257 12.8131 1.7553 11.622 1.85971 10.4367C1.96412 9.25131 2.39609 8.11832 3.10734 7.16433C3.8186 6.21033 4.78113 5.4729 5.88737 5.03445C6.99361 4.59601 8.19997 4.47381 9.37166 4.68152C10.5434 4.88923 11.6342 5.41866 12.5223 6.21065C13.4104 7.00264 14.0608 8.02599 14.4008 9.16634H16.0417C17.1357 9.16634 18.1849 9.60094 18.9585 10.3745C19.7321 11.1481 20.1667 12.1973 20.1667 13.2913C20.1667 14.3854 19.7321 15.4346 18.9585 16.2082C18.1849 16.9817 17.1357 17.4163 16.0417 17.4163Z" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>1 TB+ Storage</span>
              </div>
            </div>

            <hr className="my-6 border-white/20" />

            {/* Features */}
            <div className="space-y-3 text-sm text-white/90">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke="#22C55E" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>

                <span>Everything in Professional</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke="#22C55E" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>

                <span>Unlimited E-Signatures</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke="#22C55E" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>

                <span>Dedicated Account Manager</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke="#22C55E" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>

                <span>Custom Integrations</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke="#22C55E" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>

                <span>SLA & Uptime Guarantees</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke="#22C55E" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>

                <span>White-labeling Options</span>
              </div>
            </div>

            <button className="w-full mt-auto bg-white text-[#3B4A66] py-2 !rounded-xl font-semibold hover:bg-gray-50 transition-colors !mt-6">
              Contact Us
            </button>
          </div>

        </div>

        {/* Bottom CTA */}
        <div className="mt-16 bg-white rounded-2xl p-8 text-center  max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-[#3B4A66] mb-3">
            NEED A CUSTOM SOLUTION?
          </h3>
          <p className="text-gray-600 text-sm max-w-xl mx-auto mb-6">
            For large firms or franchise networks, we offer tailored solutions with dedicated hosting, white-labeling, and custom integrations.
          </p>
          <button className="bg-[#F56D2D] text-white px-8 py-3 !rounded-lg font-semibold hover:bg-[#E55D1D] transition-colors">
            Contact Our Sales Team
          </button>
        </div>

      </div>
    </section>
  );
}
