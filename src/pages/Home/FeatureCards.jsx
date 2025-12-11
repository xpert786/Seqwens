export default function FeatureCards() {
  return (
    <section
      className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-10 sm:py-14 md:py-16 lg:py-20 flex flex-col lg:flex-row items-start lg:items-center justify-center lg:justify-between gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-16"
    >
      {/* Left Cards Section */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 w-full max-w-md mx-auto lg:mx-0 lg:ml-4 xl:ml-10">

        {/* SOC2 Compliant Card */}
                                                          
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 md:p-8 shadow-sm h-32 sm:h-40 md:h-44 lg:h-48 flex flex-col justify-center transition-all duration-300 hover:!bg-[#00C0C6] hover:text-white hover:border-green-500 group cursor-pointer">
          <div className="text-teal-500 group-hover:text-white text-xl sm:text-2xl transition-colors duration-300">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M31.25 14.8786V16.2586C31.2482 19.4932 30.2008 22.6406 28.264 25.2313C26.3273 27.8221 23.6049 29.7173 20.503 30.6344C17.4011 31.5516 14.0859 31.4414 11.0517 30.3205C8.01752 29.1995 5.42698 27.1277 3.66644 24.4142C1.9059 21.7006 1.06969 18.4907 1.28252 15.2631C1.49534 12.0354 2.74581 8.96308 4.84742 6.5042C6.94903 4.04532 9.78918 2.33166 12.9443 1.6188C16.0994 0.90595 19.4004 1.23209 22.355 2.54859M11.75 14.7586L16.25 19.2586L31.25 4.25858" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="font-semibold !mt-8 sm:!mt-12 md:!mt-16 lg:!mt-20 !text-sm sm:!text-base md:!text-lg font-[BasisGrotesquePro]">SOC2 <br /> COMPLIANT</h3>
        </div>


        {/* HIPAA Ready Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 md:p-8 shadow-sm h-32 sm:h-40 md:h-44 lg:h-48 flex flex-col justify-center transition-all duration-300 hover:!bg-[#00C0C6] hover:text-white hover:border-green-500 group cursor-pointer">
          <div className="text-teal-500 group-hover:text-white text-xl sm:text-2xl transition-colors duration-300">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M31.25 14.8786V16.2586C31.2482 19.4932 30.2008 22.6406 28.264 25.2313C26.3273 27.8221 23.6049 29.7173 20.503 30.6344C17.4011 31.5516 14.0859 31.4414 11.0517 30.3205C8.01752 29.1995 5.42698 27.1277 3.66644 24.4142C1.9059 21.7006 1.06969 18.4907 1.28252 15.2631C1.49534 12.0354 2.74581 8.96308 4.84742 6.5042C6.94903 4.04532 9.78918 2.33166 12.9443 1.6188C16.0994 0.90595 19.4004 1.23209 22.355 2.54859M11.75 14.7586L16.25 19.2586L31.25 4.25858" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="font-semibold !mt-8 sm:!mt-12 md:!mt-16 lg:!mt-20 !text-sm sm:!text-base md:!text-lg font-[BasisGrotesquePro]">HIPAA READY</h3>
        </div>

        {/* 99.9% Uptime Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 md:p-8 shadow-sm h-32 sm:h-40 md:h-44 lg:h-48 flex flex-col justify-center transition-all duration-300 hover:!bg-[#00C0C6] hover:text-white hover:border-green-500 group cursor-pointer">
          <div className="text-teal-500 group-hover:text-white text-xl sm:text-2xl transition-colors duration-300">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M31.25 14.8786V16.2586C31.2482 19.4932 30.2008 22.6406 28.264 25.2313C26.3273 27.8221 23.6049 29.7173 20.503 30.6344C17.4011 31.5516 14.0859 31.4414 11.0517 30.3205C8.01752 29.1995 5.42698 27.1277 3.66644 24.4142C1.9059 21.7006 1.06969 18.4907 1.28252 15.2631C1.49534 12.0354 2.74581 8.96308 4.84742 6.5042C6.94903 4.04532 9.78918 2.33166 12.9443 1.6188C16.0994 0.90595 19.4004 1.23209 22.355 2.54859M11.75 14.7586L16.25 19.2586L31.25 4.25858" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="font-semibold !mt-6 sm:!mt-10 md:!mt-12 lg:!mt-15 !text-sm sm:!text-base md:!text-lg font-[BasisGrotesquePro]">99.9% UPTIME</h3>
        </div>

        {/* 24/7 Support Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 md:p-8 shadow-sm h-32 sm:h-40 md:h-44 lg:h-48 flex flex-col justify-center transition-all duration-300 hover:!bg-[#00C0C6] hover:text-white hover:border-green-500 group cursor-pointer">
          <div className="text-teal-500 group-hover:text-white text-xl sm:text-2xl transition-colors duration-300">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M31.25 14.8786V16.2586C31.2482 19.4932 30.2008 22.6406 28.264 25.2313C26.3273 27.8221 23.6049 29.7173 20.503 30.6344C17.4011 31.5516 14.0859 31.4414 11.0517 30.3205C8.01752 29.1995 5.42698 27.1277 3.66644 24.4142C1.9059 21.7006 1.06969 18.4907 1.28252 15.2631C1.49534 12.0354 2.74581 8.96308 4.84742 6.5042C6.94903 4.04532 9.78918 2.33166 12.9443 1.6188C16.0994 0.90595 19.4004 1.23209 22.355 2.54859M11.75 14.7586L16.25 19.2586L31.25 4.25858" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="font-semibold !mt-4 sm:!mt-8 md:!mt-10 lg:!mt-12 !text-sm sm:!text-base md:!text-lg font-[BasisGrotesquePro] leading-tight">24/7<br />SUPPORT</h3>
        </div>
      </div>

      {/* Right Side Content */}
      <div className="max-w-xl w-full lg:w-auto px-2 sm:px-0">
        <p className="text-xs sm:text-sm text-[#4B5563] font-medium font-[BasisGrotesquePro]">About SeQwens</p>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 leading-tight">
          BUILT BY TAX<br />
          PROFESSIONALS,<br />
          <span className="text-[#F49C2D] font-[BasisGrotesquePro]">FOR TAX PROFESSIONALS</span>
        </h2>

        <p className="text-sm sm:text-base text-[#3B4A66] mt-4 sm:mt-5 leading-relaxed font-[BasisGrotesquePro]">
          SeQwens was founded in 2020 by a team of CPAs and tax professionals who were
          frustrated with the fragmented tools available for managing modern tax practices.
          <br /><br />
          Our mission is to create the most comprehensive, secure, and intuitive platform
          that helps tax professionals focus on what matters most: serving their taxpayers
          and growing their practice.
        </p>

        <button className="mt-6 sm:mt-8 bg-[#F56D2D] hover:bg-orange-600 text-white px-5 sm:px-6 py-2 sm:py-2.5 !rounded-lg transition font-[BasisGrotesquePro] text-sm sm:text-base w-full sm:w-auto">
          Learn More About Us
        </button>
      </div>
    </section>
  );
}
