export default function FeatureCards() {
  return (
    <section
      className="max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-start lg:items-center justify-center lg:justify-between gap-10 md:gap-12 lg:gap-16"
    >
      {/* Left Cards Section */}
      <div className="grid grid-cols-2 gap-6 w-full max-w-md md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 ml-10">

        {/* SOC2 Compliant Card */}
                                                          
        <div className="bg-teal-500 text-white rounded-3xl p-8 shadow-md h-60 flex flex-col justify-between">
          <div className="!text-xl">
            <svg width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M35.75 18.0045V19.4995C35.748 23.0037 34.6133 26.4134 32.5152 29.22C30.417 32.0266 27.4678 34.0798 24.1075 35.0734C20.7471 36.0669 17.1555 35.9476 13.8685 34.7332C10.5815 33.5188 7.77506 31.2745 5.86781 28.3348C3.96056 25.3951 3.05466 21.9176 3.28522 18.421C3.51579 14.9245 4.87046 11.5961 7.14721 8.93228C9.42395 6.26849 12.5008 4.41203 15.9188 3.63977C19.3368 2.86751 22.9129 3.22083 26.1138 4.64704M14.625 17.8745L19.5 22.7495L35.75 6.49953" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h3 className="font-semibold font-[BasisGrotesquePro] !text-lg">
            SOC2 <br /> COMPLIANT
          </h3>
        </div>


        {/* HIPAA Ready Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm h-48 flex flex-col justify-center">
          <div className="text-teal-500 text-2xl">
            <svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M31.25 14.8786V16.2586C31.2482 19.4932 30.2008 22.6406 28.264 25.2313C26.3273 27.8221 23.6049 29.7173 20.503 30.6344C17.4011 31.5516 14.0859 31.4414 11.0517 30.3205C8.01752 29.1995 5.42698 27.1277 3.66644 24.4142C1.9059 21.7006 1.06969 18.4907 1.28252 15.2631C1.49534 12.0354 2.74581 8.96308 4.84742 6.5042C6.94903 4.04532 9.78918 2.33166 12.9443 1.6188C16.0994 0.90595 19.4004 1.23209 22.355 2.54859M11.75 14.7586L16.25 19.2586L31.25 4.25858" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <h3 className="font-semibold !mt-20 !text-lg font-[BasisGrotesquePro]">HIPAA READY</h3>
        </div>

        {/* 99.9% Uptime Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm h-48 flex flex-col justify-center">
          <div className="text-teal-500 text-2xl">
            <svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M31.25 14.8786V16.2586C31.2482 19.4932 30.2008 22.6406 28.264 25.2313C26.3273 27.8221 23.6049 29.7173 20.503 30.6344C17.4011 31.5516 14.0859 31.4414 11.0517 30.3205C8.01752 29.1995 5.42698 27.1277 3.66644 24.4142C1.9059 21.7006 1.06969 18.4907 1.28252 15.2631C1.49534 12.0354 2.74581 8.96308 4.84742 6.5042C6.94903 4.04532 9.78918 2.33166 12.9443 1.6188C16.0994 0.90595 19.4004 1.23209 22.355 2.54859M11.75 14.7586L16.25 19.2586L31.25 4.25858" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <h3 className="font-semibold !mt-15 !text-lg font-[BasisGrotesquePro]">99.9% UPTIME</h3>
        </div>

        {/* 24/7 Support Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm h-48 flex flex-col justify-center">
          <div className="text-teal-500 text-2xl">
            <svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M31.25 14.8786V16.2586C31.2482 19.4932 30.2008 22.6406 28.264 25.2313C26.3273 27.8221 23.6049 29.7173 20.503 30.6344C17.4011 31.5516 14.0859 31.4414 11.0517 30.3205C8.01752 29.1995 5.42698 27.1277 3.66644 24.4142C1.9059 21.7006 1.06969 18.4907 1.28252 15.2631C1.49534 12.0354 2.74581 8.96308 4.84742 6.5042C6.94903 4.04532 9.78918 2.33166 12.9443 1.6188C16.0994 0.90595 19.4004 1.23209 22.355 2.54859M11.75 14.7586L16.25 19.2586L31.25 4.25858" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <h3 className="font-semibold !mt-12 !text-lg font-[BasisGrotesquePro]">24/7<br />SUPPORT</h3>
        </div>
      </div>

      {/* Right Side Content */}
      <div className="max-w-xl">
        <p className="text-sm text-[#4B5563] font-medium font-[BasisGrotesquePro]">About SeQwens</p>

        <h2 className="text-4xl font-bold mt-2 leading-tight">
          BUILT BY TAX<br />
          PROFESSIONALS,<br />
          <span className="text-[#F49C2D] font-[BasisGrotesquePro]">FOR TAX PROFESSIONALS</span>
        </h2>

        <p className="text-[#3B4A66] mt-5 leading-relaxed font-[BasisGrotesquePro]">
          SeQwens was founded in 2020 by a team of CPAs and tax professionals who were
          frustrated with the fragmented tools available for managing modern tax practices.
          <br /><br />
          Our mission is to create the most comprehensive, secure, and intuitive platform
          that helps tax professionals focus on what matters most: serving their clients
          and growing their practice.
        </p>

        <button className="mt-8 bg-[#F56D2D] hover:bg-orange-600 text-white px-6 py-2 !rounded-lg transition font-[BasisGrotesquePro]">
          Learn More About Us
        </button>
      </div>
    </section>
  );
}
