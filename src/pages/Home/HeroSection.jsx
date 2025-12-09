import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import heroImage from "../../assets/heroimage.png";

// 💥 Import all your trust logo images from assets
import img1 from "../../assets/imagess1.png";
import img2 from "../../assets/imagess2.png";
import img3 from "../../assets/imagess3.png";
import img4 from "../../assets/imagess4.png";
import img5 from "../../assets/imagess5.png";
import img6 from "../../assets/imagess6.png";

export default function HeroSection() {
  const navigate = useNavigate();

  // Add imported images here
  const trustLogos = useMemo(
    () => [img1, img2, img3, img4, img5, img6],
    []
  );

  return (
    <div className="">
      <main className="flex-1 w-full px-2 sm:px-4 md:px-6 lg:px-10 xl:px-12 py-0">
        <section
          className="w-full mx-auto rounded-[20px] sm:rounded-[30px] lg:rounded-[40px] font-[BasisGrotesquePro]
          bg-gradient-to-b from-[#253C5F] via-[#1A4567] to-[#356890]
          text-white 
          pt-8 pb-12 sm:pt-12 sm:pb-16 md:pt-16 md:pb-20 lg:pt-20 lg:pb-24 px-3 sm:px-4 md:px-6 lg:px-8"
        >
          {/* ---------- TOP TEXT ---------- */}
          <div className="flex flex-col items-center text-center gap-3 sm:gap-4 md:gap-6 max-w-3xl mx-auto">
            <h1 className="text-[28px] sm:text-[36px] md:text-[44px] lg:text-[54px] font-extrabold leading-tight tracking-wide text-white px-2">
              TRANSFORM YOUR <span className="text-[#FFB84D]">TAX</span><br />
              PRACTICE
            </h1>

            <p className="text-[14px] sm:text-[16px] md:text-[18px] text-[#D9E8FF] max-w-2xl leading-relaxed mt-1 sm:mt-2 px-2">
              The all-in-one platform with AI-powered tools to streamline taxpayer management,
              automate workflows, and scale your practice.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-2 sm:mt-4 w-full sm:w-auto px-2">

              <button className="w-full sm:w-auto px-6 sm:px-7 py-2.5 sm:py-2 !rounded-lg bg-[#FF7A2E] text-white font-semibold shadow-lg flex items-center justify-center gap-2 text-[14px] sm:text-[15px] hover:bg-[#FF6A1E] transition-colors">
                Take a Tour
                <span className="text-base sm:text-lg">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect width="20" height="20" rx="10" fill="white" />
                    <path
                      d="M14.0833 8.98991C14.8608 9.43908 14.8608 10.5614 14.0833 11.0106L8.83325 14.0416C8.05567 14.4907 7.08325 13.9296 7.08325 13.0312V6.96924C7.08325 6.07091 8.05567 5.50974 8.83325 5.95891L14.0833 8.98991Z"
                      fill="#00C0C6"
                      stroke="#00C0C6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          {/* ---------- VIDEO CONTAINER ---------- */}
          <div className="w-full flex justify-center mt-6 sm:mt-8 md:mt-10 lg:mt-12 px-2">
            <div className="bg-white/90 rounded-[20px] sm:rounded-[25px] md:rounded-[30px] p-1.5 sm:p-2 w-full max-w-[900px]">
              <div className="relative rounded-[16px] sm:rounded-[20px] md:rounded-[26px] overflow-hidden aspect-video w-full bg-[#E8EEF7] flex items-center justify-center">
                <img
                  src={heroImage}
                  className="w-full h-full object-cover"
                  alt="Hero Visual"
                />

                <button className="absolute w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] md:w-[70px] md:h-[70px] bg-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition active:scale-95">
                  <span className="text-lg sm:text-xl md:text-2xl text-[#0B1F3A]">
                    <svg className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[152px] md:h-[152px]" viewBox="0 0 152 152" fill="none">
                      <rect x="21" y="21" width="110" height="110" rx="55" fill="white" />
                      <rect x="10.5" y="10.5" width="131" height="131" rx="65.5" stroke="white" strokeOpacity="0.48" strokeWidth="21" />
                      <path
                        d="M93.5 71.6696C96.8325 73.5946 96.8325 78.4046 93.5 80.3296L71 93.3196C67.6675 95.2446 63.5 92.8396 63.5 88.9896V63.0096C63.5 59.1596 67.6675 56.7546 71 58.6796L93.5 71.6696Z"
                        fill="#00C0C6"
                        stroke="#00C0C6"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ---------- TRUSTED BY ---------- */}
          <div className="w-full mt-8 sm:mt-12 md:mt-14 lg:mt-16 text-center px-2">
            <p className="text-white text-[16px] sm:text-[18px] md:text-[20px]">
              <span className="text-[#F49C2D] font-semibold">Trusted by</span> leading tax firms worldwide
            </p>

            {/* Logos Row */}
            <div className="w-full flex flex-wrap justify-center gap-6 sm:gap-10 md:gap-16 lg:gap-20 mt-6 sm:mt-8 md:mt-10 opacity-85 px-2">
              {trustLogos.map((logo, index) => (
                <img
                  key={index}
                  src={logo}
                  className="h-6 sm:h-8 md:h-10 object-contain"
                  alt={`trusted-logo-${index}`}
                />
              ))}
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}
