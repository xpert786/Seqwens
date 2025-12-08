import { useState } from "react";

export default function AiAutomation() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section className="max-w-7xl mx-auto px-5 py-16 ">

      {/* Top Titles */}
      <div className="text-center space-y-3 mb-16">
        <p className="text-gray-500 text-sm font-medium">AI–Powered</p>

        <h2 className="text-4xl md:text-5xl font-bold text-[#3B4A66] leading-tight">
          SUPERCHARGE YOUR PRACTICE WITH
        </h2>

        <h2 className="text-4xl md:text-5xl font-bold !text-[#F49C2D]">
          ARTIFICIAL INTELLIGENCE
        </h2>

        <p className="text-[#3B4A66] text-base max-w-3xl mx-auto mt-6">
          Our advanced AI tools automate repetitive tasks, extract data with precision, and provide insights<br />
          that help you work smarter.
        </p>
      </div>

      {/* 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

        {/* LEFT SIDE Features List */}
        <div className="space-y-4">

          {/* Feature 1 – highlighted box */}
          <div
            onClick={() => setActiveFeature(0)}
            className={`rounded-2xl p-6 flex gap-5 items-start cursor-pointer transition-all duration-300 ${activeFeature === 0
              ? 'border-2 border-[#FFD8BC] bg-[#FFF9F0] shadow-sm'
              : 'border-2 border-transparent hover:border-gray-200'
              }`}
          >
            <div className="flex-shrink-0">
              <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="54" height="54" rx="15" fill="#00C0C6" />
                <path d="M22.5001 15C22.8284 15 23.1535 15.0647 23.4568 15.1903C23.7601 15.3159 24.0357 15.5001 24.2678 15.7322C24.5 15.9644 24.6841 16.24 24.8098 16.5433C24.9354 16.8466 25.0001 17.1717 25.0001 17.5V32.5C24.9987 33.1239 24.7642 33.7247 24.3425 34.1845C23.9208 34.6442 23.3424 34.9297 22.721 34.9848C22.0996 35.04 21.48 34.8607 20.9839 34.4824C20.4879 34.104 20.1512 33.5539 20.0401 32.94C19.6212 33.0333 19.1854 33.0171 18.7745 32.8931C18.3637 32.7691 17.9917 32.5415 17.6943 32.232C17.3969 31.9226 17.1842 31.5419 17.0767 31.1264C16.9691 30.711 16.9703 30.2749 17.0801 29.86C16.5049 29.6753 15.9989 29.3212 15.6284 28.8441C15.2578 28.367 15.0399 27.7892 15.0031 27.1862C14.9664 26.5832 15.1125 25.9832 15.4224 25.4647C15.7324 24.9461 16.1916 24.5332 16.7401 24.28C16.414 23.9578 16.1827 23.5522 16.0716 23.1075C15.9605 22.6628 15.9738 22.1961 16.1101 21.7584C16.2463 21.3207 16.5003 20.9289 16.8442 20.6259C17.1881 20.3228 17.6087 20.1201 18.0601 20.04C17.9873 19.7126 17.9811 19.3739 18.0419 19.0441C18.1027 18.7143 18.2292 18.4001 18.4139 18.1201C18.5987 17.8402 18.8378 17.6003 19.1172 17.4148C19.3966 17.2292 19.7104 17.1018 20.0401 17.04C20.1475 16.4663 20.4523 15.9482 20.9016 15.5756C21.3509 15.203 21.9164 14.9994 22.5001 15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M27.5 15C26.837 15 26.2011 15.2634 25.7322 15.7322C25.2634 16.2011 25 16.837 25 17.5V32.5C25.0013 33.1239 25.2359 33.7247 25.6576 34.1845C26.0793 34.6442 26.6577 34.9297 27.2791 34.9848C27.9005 35.04 28.5201 34.8607 29.0161 34.4824C29.5122 34.104 29.8489 33.5539 29.96 32.94C30.3789 33.0333 30.8147 33.0171 31.2256 32.8931C31.6364 32.7691 32.0084 32.5415 32.3058 32.232C32.6031 31.9226 32.8158 31.5419 32.9234 31.1264C33.031 30.711 33.0298 30.2749 32.92 29.86C33.4952 29.6753 34.0011 29.3212 34.3717 28.8441C34.7423 28.367 34.9602 27.7892 34.997 27.1862C35.0337 26.5832 34.8876 25.9832 34.5776 25.4647C34.2677 24.9461 33.8085 24.5332 33.26 24.28C33.5861 23.9578 33.8173 23.5522 33.9285 23.1075C34.0396 22.6628 34.0263 22.1961 33.89 21.7584C33.7538 21.3207 33.4998 20.9289 33.1559 20.6259C32.812 20.3228 32.3913 20.1201 31.94 20.04C32.0128 19.7126 32.019 19.3739 31.9582 19.0441C31.8974 18.7143 31.7709 18.4001 31.5862 18.1201C31.4014 17.8402 31.1622 17.6003 30.8829 17.4148C30.6035 17.2292 30.2896 17.1018 29.96 17.04C29.8526 16.4663 29.5478 15.9482 29.0985 15.5756C28.6492 15.203 28.0837 14.9994 27.5 15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div>
              <h5 className="font-bold text-base text-[#3B4A66] mb-2">
                SMART DOCUMENT CLASSIFICATION
              </h5>
              <p className="text-gray-600 text-sm leading-relaxed">
                AI automatically categorizes uploaded documents by type, saving<br />hours of manual sorting.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div
            onClick={() => setActiveFeature(1)}
            className={`rounded-2xl p-6 flex gap-5 items-start cursor-pointer transition-all duration-300 ${activeFeature === 1
              ? 'border-2 border-[#FFD8BC] bg-[#FFF9F0] shadow-sm'
              : 'border-2 border-transparent hover:border-gray-200'
              }`}
          >
            <div className="flex-shrink-0">
              <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="54" height="54" rx="15" fill="#00C0C6" />
                <path d="M31 17H19C17.8954 17 17 17.8954 17 19V31C17 32.1046 17.8954 33 19 33H31C32.1046 33 33 32.1046 33 31V19C33 17.8954 32.1046 17 31 17Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M28 22H22V28H28V22Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M28 15V17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M28 33V35" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M15 28H17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M15 22H17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M33 28H35" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M33 22H35" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M22 15V17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M22 33V35" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div>
              <h5 className="font-bold text-base text-[#3B4A66] mb-2">
                INTELLIGENT DATA EXTRACTION
              </h5>
              <p className="text-gray-600 text-sm leading-relaxed">
                Extract key information from tax forms and documents with high<br />accuracy.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div
            onClick={() => setActiveFeature(2)}
            className={`rounded-2xl p-6 flex gap-5 items-start cursor-pointer transition-all duration-300 ${activeFeature === 2
              ? 'border-2 border-[#FFD8BC] bg-[#FFF9F0] shadow-sm'
              : 'border-2 border-transparent hover:border-gray-200'
              }`}
          >
            <div className="flex-shrink-0">
              <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="54" height="54" rx="15" fill="#00C0C6" />
                <path d="M25 16L23.088 21.813C22.9901 22.1105 22.8238 22.3809 22.6023 22.6023C22.3809 22.8238 22.1105 22.9901 21.813 23.088L16 25L21.813 26.912C22.1105 27.0099 22.3809 27.1762 22.6023 27.3977C22.8238 27.6191 22.9901 27.8895 23.088 28.187L25 34L26.912 28.187C27.0099 27.8895 27.1762 27.6191 27.3977 27.3977C27.6191 27.1762 27.8895 27.0099 28.187 26.912L34 25L28.187 23.088C27.8895 22.9901 27.6191 22.8238 27.3977 22.6023C27.1762 22.3809 27.0099 22.1105 26.912 21.813L25 16Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M18 16V20" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M32 30V34" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M16 18H20" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M30 32H34" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div>
              <h5 className="font-bold text-base text-[#3B4A66] mb-2">
                ANOMALY DETECTION
              </h5>
              <p className="text-gray-600 text-sm leading-relaxed">
                Identify unusual patterns or potential errors in financial data before<br />they become issues.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div
            onClick={() => setActiveFeature(3)}
            className={`rounded-2xl p-6 flex gap-5 items-start cursor-pointer transition-all duration-300 ${activeFeature === 3
              ? 'border-2 border-[#FFD8BC] bg-[#FFF9F0] shadow-sm'
              : 'border-2 border-transparent hover:border-gray-200'
              }`}
          >
            <div className="flex-shrink-0">
              <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="54" height="54" rx="15" fill="#00C0C6" />
                <path d="M35 20L26.5 28.5L21.5 23.5L15 30" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M29 20H35V26" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div>
              <h5 className="font-bold text-base text-[#3B4A66] mb-2">
                PREDICTIVE ANALYTICS
              </h5>
              <p className="text-gray-600 text-sm leading-relaxed">
                Forecast client needs and optimize practice workflow based on<br />historical patterns.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE Gradient Document Box */}

        <div
          className="w-full relative overflow-hidden rounded-3xl p-6 text-white !bg-[#3B4A66] "

        >

          {/* BLUE GLOW CIRCLE */}
          <div className="absolute -left-32 -bottom-20 w-96 h-96 bg-[#32D4F5] opacity-40 rounded-full blur-[30px]"></div>



          {/* ORANGE GLOW CIRCLE */}
          <div className="absolute -right-48 bottom-0 w-96 h-96 bg-[#F49C2D] opacity-55 rounded-full blur-[30px]"></div>


          {/* TOP LIGHT FADE */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-20"></div>

          {/* Your Content */}
          <div className="relative z-10">
    
          </div>






          {/* White top card */}
          <div className="bg-white text-[#3B4A66] rounded-xl p-3 font-semibold text-sm mb-6 flex items-center gap-3 shadow-lg">
            <div className="w-9 h-9 bg-[#00C0C6] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="42" height="42" rx="12" fill="#00C0C6" />
                <path d="M18.7084 11.833C19.0093 11.833 19.3073 11.8923 19.5854 12.0075C19.8634 12.1226 20.116 12.2914 20.3288 12.5042C20.5416 12.717 20.7104 12.9697 20.8256 13.2477C20.9408 13.5257 21 13.8237 21 14.1247V27.8747C20.9988 28.4466 20.7838 28.9973 20.3972 29.4188C20.0107 29.8402 19.4805 30.1019 18.9109 30.1524C18.3412 30.203 17.7733 30.0387 17.3186 29.6919C16.8639 29.345 16.5553 28.8407 16.4534 28.278C16.0694 28.3635 15.6699 28.3487 15.2933 28.235C14.9167 28.1214 14.5757 27.9127 14.3031 27.629C14.0305 27.3454 13.8355 26.9964 13.7369 26.6156C13.6383 26.2347 13.6394 25.835 13.74 25.4547C13.2128 25.2853 12.749 24.9607 12.4093 24.5234C12.0696 24.0861 11.8698 23.5564 11.8361 23.0037C11.8025 22.451 11.9364 21.9009 12.2205 21.4256C12.5046 20.9503 12.9256 20.5718 13.4284 20.3397C13.1294 20.0444 12.9175 19.6726 12.8156 19.2649C12.7138 18.8572 12.7259 18.4294 12.8509 18.0282C12.9758 17.627 13.2086 17.2679 13.5238 16.99C13.8391 16.7122 14.2246 16.5265 14.6384 16.453C14.5716 16.1529 14.5659 15.8424 14.6217 15.5401C14.6774 15.2378 14.7934 14.9497 14.9627 14.6931C15.1321 14.4366 15.3513 14.2167 15.6074 14.0466C15.8635 13.8765 16.1512 13.7596 16.4534 13.703C16.5518 13.1771 16.8312 12.7022 17.2431 12.3606C17.6549 12.0191 18.1733 11.8324 18.7084 11.833Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M23.2917 11.833C22.6839 11.833 22.101 12.0745 21.6712 12.5042C21.2414 12.934 21 13.5169 21 14.1247V27.8747C21.0012 28.4466 21.2162 28.9973 21.6028 29.4188C21.9894 29.8402 22.5195 30.1019 23.0892 30.1524C23.6588 30.203 24.2268 30.0387 24.6815 29.6919C25.1362 29.345 25.4448 28.8407 25.5467 28.278C25.9306 28.3635 26.3302 28.3487 26.7068 28.235C27.0834 28.1214 27.4244 27.9127 27.697 27.629C27.9695 27.3454 28.1645 26.9964 28.2631 26.6156C28.3617 26.2347 28.3607 25.835 28.26 25.4547C28.7872 25.2853 29.251 24.9607 29.5907 24.5234C29.9304 24.0861 30.1302 23.5564 30.1639 23.0037C30.1976 22.451 30.0636 21.9009 29.7795 21.4256C29.4954 20.9503 29.0744 20.5718 28.5717 20.3397C28.8706 20.0444 29.0826 19.6726 29.1844 19.2649C29.2863 18.8572 29.2741 18.4294 29.1492 18.0282C29.0243 17.627 28.7915 17.2679 28.4762 16.99C28.161 16.7122 27.7754 16.5265 27.3617 16.453C27.4284 16.1529 27.4341 15.8424 27.3784 15.5401C27.3226 15.2378 27.2067 14.9497 27.0373 14.6931C26.868 14.4366 26.6487 14.2167 26.3926 14.0466C26.1365 13.8765 25.8488 13.7596 25.5467 13.703C25.4482 13.1771 25.1688 12.7022 24.757 12.3606C24.3451 12.0191 23.8267 11.8324 23.2917 11.833Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>

            </div>
            <div>
              <div className="font-bold text-sm">DOCUMENT ANALYSIS</div>
              <div className="text-gray-400 text-xs">AI Processing</div>
            </div>
          </div>

          {/* Inner Document Section */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 space-y-3 border-2 border-white/30">

            <h3 className="text-white font-bold text-sm mb-3 uppercase tracking-wider">SMART DOCUMENT</h3>

            {/* File Row */}
            <div className="flex justify-between items-center bg-white px-4 py-2.5 rounded-lg shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-[#00C0C6]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.79199 21.25H16.208C17.1363 21.25 18.0265 20.8813 18.6829 20.2249C19.3392 19.5685 19.708 18.6783 19.708 17.75V12.22C19.7083 11.2919 19.34 10.4016 18.684 9.745L12.715 3.775C12.39 3.45 12.0041 3.19221 11.5794 3.01634C11.1548 2.84047 10.6996 2.74997 10.24 2.75H7.79199C6.86373 2.75 5.9735 3.11875 5.31712 3.77513C4.66074 4.4315 4.29199 5.32174 4.29199 6.25V17.75C4.29199 18.6783 4.66074 19.5685 5.31712 20.2249C5.9735 20.8813 6.86373 21.25 7.79199 21.25Z" stroke="#00C0C6" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M11.688 3.11035V8.77035C11.688 9.30079 11.8987 9.80949 12.2738 10.1846C12.6488 10.5596 13.1576 10.7704 13.688 10.7704H19.35" stroke="#00C0C6" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M7.25 16.5V15.5M7.25 15.5V13.5H8.25C8.51522 13.5 8.76957 13.6054 8.95711 13.7929C9.14464 13.9804 9.25 14.2348 9.25 14.5C9.25 14.7652 9.14464 15.0196 8.95711 15.2071C8.76957 15.3946 8.51522 15.5 8.25 15.5H7.25ZM15.25 16.5V15.25M15.25 15.25V13.5H16.75M15.25 15.25H16.75M11.25 16.5V13.5H11.75C12.1478 13.5 12.5294 13.658 12.8107 13.9393C13.092 14.2206 13.25 14.6022 13.25 15C13.25 15.3978 13.092 15.7794 12.8107 16.0607C12.5294 16.342 12.1478 16.5 11.75 16.5H11.25Z" stroke="#00C0C6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>

                </div>
                <span className="text-gray-700 text-xs font-medium">abc.pdf</span>
              </div>

              {/* Download Button with dropdown icon */}
              <div className="flex items-center gap-1.5">
                <button className="text-white bg-[#F56D2D] px-3 py-1 !rounded-md text-xs font-bold hover:bg-[#E55D1D] transition-colors">
                  Download
                </button>
                <button className="text-[#F56D2D] text-lg font-bold hover:text-[#E55D1D]">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="18" height="18" rx="3" fill="white" />
                    <path d="M9.54756 7.68415C9.63922 7.43665 10.0275 7.43665 10.1192 7.68415L10.6566 9.1369C10.7749 9.45626 10.9742 9.74642 11.2387 9.98439C11.5033 10.2224 11.8258 10.4016 12.1806 10.5079L13.7938 10.9917C14.0687 11.0742 14.0687 11.4237 13.7938 11.5062L12.1798 11.9899C11.825 12.0964 11.5026 12.2758 11.2382 12.5139C10.9738 12.752 10.7747 13.0423 10.6566 13.3617L10.1192 14.8137C10.0994 14.8679 10.0611 14.9151 10.0098 14.9485C9.95849 14.982 9.89673 15 9.83336 15C9.76999 15 9.70824 14.982 9.65692 14.9485C9.60559 14.9151 9.56732 14.8679 9.54756 14.8137L9.01012 13.3609C8.8919 13.0416 8.69272 12.7515 8.42834 12.5136C8.16396 12.2756 7.84166 12.0963 7.48695 11.9899L5.87295 11.5062C5.81274 11.4884 5.76031 11.4539 5.72314 11.4077C5.68597 11.3615 5.66595 11.306 5.66595 11.2489C5.66595 11.1919 5.68597 11.1363 5.72314 11.0901C5.76031 11.0439 5.81274 11.0094 5.87295 10.9917L7.48695 10.5079C7.84166 10.4015 8.16396 10.2222 8.42834 9.98425C8.69272 9.74628 8.8919 9.45617 9.01012 9.1369L9.54756 7.68415ZM6.32874 3.85988C6.34069 3.8274 6.3637 3.79914 6.39452 3.7791C6.42533 3.75907 6.46238 3.74829 6.50039 3.74829C6.5384 3.74829 6.57544 3.75907 6.60626 3.7791C6.63707 3.79914 6.66009 3.8274 6.67204 3.85988L6.9945 4.73138C7.13865 5.11989 7.47695 5.42439 7.90857 5.55414L8.8768 5.84439C8.91288 5.85514 8.94428 5.87586 8.96654 5.9036C8.9888 5.93133 9.00078 5.96468 9.00078 5.99889C9.00078 6.0331 8.9888 6.06645 8.96654 6.09418C8.94428 6.12192 8.91288 6.14264 8.8768 6.15339L7.90857 6.44364C7.69557 6.50727 7.50202 6.61478 7.34333 6.75762C7.18464 6.90046 7.06519 7.07468 6.9945 7.2664L6.67204 8.1379C6.66009 8.17038 6.63707 8.19864 6.60626 8.21867C6.57544 8.23871 6.5384 8.24949 6.50039 8.24949C6.46238 8.24949 6.42533 8.23871 6.39452 8.21867C6.3637 8.19864 6.34069 8.17038 6.32874 8.1379L6.00627 7.2664C5.93558 7.07468 5.81614 6.90046 5.65745 6.75762C5.49875 6.61478 5.3052 6.50727 5.09221 6.44364L4.12398 6.15339C4.08789 6.14264 4.05649 6.12192 4.03423 6.09418C4.01198 6.06645 4 6.0331 4 5.99889C4 5.96468 4.01198 5.93133 4.03423 5.9036C4.05649 5.87586 4.08789 5.85514 4.12398 5.84439L5.09221 5.55414C5.3052 5.49051 5.49875 5.38299 5.65745 5.24016C5.81614 5.09732 5.93558 4.9231 6.00627 4.73138L6.32874 3.85988ZM12.2189 3.07313C12.2272 3.05177 12.2426 3.03325 12.263 3.02015C12.2835 3.00704 12.308 3 12.3331 3C12.3582 3 12.3827 3.00704 12.4032 3.02015C12.4236 3.03325 12.439 3.05177 12.4472 3.07313L12.6622 3.65363C12.758 3.91313 12.9839 4.11638 13.2722 4.20263L13.9171 4.39613C13.9408 4.40354 13.9614 4.41741 13.976 4.43583C13.9905 4.45424 13.9983 4.47628 13.9983 4.49888C13.9983 4.52149 13.9905 4.54353 13.976 4.56194C13.9614 4.58036 13.9408 4.59423 13.9171 4.60163L13.2722 4.79513C13.1302 4.83788 13.0012 4.90973 12.8954 5.005C12.7895 5.10027 12.7097 5.21637 12.6622 5.34414L12.4472 5.92464C12.439 5.94599 12.4236 5.96451 12.4032 5.97762C12.3827 5.99072 12.3582 5.99777 12.3331 5.99777C12.308 5.99777 12.2835 5.99072 12.263 5.97762C12.2426 5.96451 12.2272 5.94599 12.2189 5.92464L12.004 5.34414C11.9565 5.21637 11.8767 5.10027 11.7708 5.005C11.665 4.90973 11.536 4.83788 11.394 4.79513L10.7499 4.60163C10.7262 4.59423 10.7056 4.58036 10.6911 4.56194C10.6765 4.54353 10.6687 4.52149 10.6687 4.49888C10.6687 4.47628 10.6765 4.45424 10.6911 4.43583C10.7056 4.41741 10.7262 4.40354 10.7499 4.39613L11.3949 4.20263C11.6832 4.11638 11.909 3.91313 12.0048 3.65363L12.2189 3.07313Z" fill="#EF4444" />
                  </svg>

                </button>
              </div>
            </div>

            {/* 4 Empty Gray Input Rows */}
            <div className="space-y-3 mt-4">
              <div className="h-10 bg-gradient-to-r from-white/15 to-white/25 backdrop-blur-sm rounded-lg border border-white/40"></div>
              <div className="h-10 bg-gradient-to-r from-white/15 to-white/25 backdrop-blur-sm rounded-lg border border-white/40"></div>
              <div className="h-10 bg-gradient-to-r from-white/15 to-white/25 backdrop-blur-sm rounded-lg border border-white/40"></div>
              <div className="h-10 bg-gradient-to-r from-white/15 to-white/25 backdrop-blur-sm rounded-lg border border-white/40"></div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
