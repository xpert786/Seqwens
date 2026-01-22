import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, getUserData, getStorage } from "../../ClientOnboarding/utils/userUtils";

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
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(() => isLoggedIn());
  const [userData, setUserData] = useState(() => (isLoggedIn() ? getUserData() : null));

  useEffect(() => {
    const checkAuth = () => {
      const loggedIn = isLoggedIn();
      setIsUserLoggedIn(loggedIn);
      if (loggedIn) {
        setUserData(getUserData());
      } else {
        setUserData(null);
      }
    };
    checkAuth();
    const interval = setInterval(checkAuth, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleDashboardClick = () => {
    if (!isUserLoggedIn || !userData) {
      navigate("/login");
      return;
    }

    const storage = getStorage();
    const userType = storage?.getItem("userType") || userData?.user_type;

    if (userType === 'super_admin' || userType === 'support_admin' || userType === 'billing_admin') {
      navigate("/superadmin");
    } else if (userType === 'admin' || userType === 'firm') {
      navigate("/firmadmin");
    } else if (userType === 'tax_preparer') {
      navigate("/taxdashboard");
    } else {
      // For clients and others
      const isCompleted = userData.is_completed;
      if (isCompleted) {
        navigate("/dashboard");
      } else {
        navigate("/dashboard-first");
      }
    }
  };

  const getUserInitials = () => {
    if (!userData) return "U";
    const firstName = userData.first_name || userData.name || "";
    const lastName = userData.last_name || "";
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    return "U";
  };

  // Add imported images here
  const trustLogos = useMemo(
    () => [img1, img2, img3, img4, img5, img6],
    []
  );

  return (
    <div className="" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic">
      {/* Test element to verify AOS is working */}
      <div 
        data-aos="fade-down" 
        data-aos-duration="1000" 
        className="fixed top-4 left-4 bg-green-500 text-white px-3 py-1 rounded text-sm z-50 hidden md:block"
        style={{ display: 'none' }}
      >
        AOS Working!
      </div>
      <main className="flex-1 w-full px-2 sm:px-4 md:px-6 lg:px-10 xl:px-12 py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 w-full min-h-screen relative z-10">
          <div className="px-8 lg:px-16 xl:px-20 flex flex-col justify-center py-20 lg:py-0">
            <div data-aos="fade-right" data-aos-duration="1200" data-aos-easing="ease-out-cubic" data-aos-delay="300">
              <div className="backdrop-blur-xs py-4 rounded-xl border border-zinc-800/30 inline-block mb-6" data-aos="zoom-in" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay="500">
                <div className="flex items-center">
                  <svg className="h-8 fill-current text-stone-400 text-opacity-75 transition duration-300 group-hover:-translate-x-1 group-hover:scale-105 group-hover:text-[#fd9b61] group-hover:duration-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" aria-hidden="true">
                    <path d="M16.247 24.571c-.68-.058-1.523.13-2.098.48-.246.142-.28.364-.07.552.527.48 1.336.843 2.027.89.715.094 1.57-.129 2.145-.562.188-.13.2-.328.023-.492-.515-.48-1.324-.82-2.027-.868Zm2.461-3.96c-.375.574-.586 1.417-.562 2.097.046.715.375 1.535.832 2.04.152.175.34.175.492-.013.457-.539.703-1.394.633-2.12-.047-.68-.387-1.489-.856-2.028-.176-.21-.387-.2-.539.023Zm-5.765.785c-.645-.235-1.524-.258-2.18-.059-.258.082-.328.281-.188.516.387.597 1.078 1.148 1.723 1.382.656.27 1.547.27 2.215-.011.223-.082.281-.258.152-.469-.375-.598-1.066-1.137-1.722-1.36Zm3.374-3.188c-.503.457-.937 1.207-1.066 1.875-.152.703-.047 1.582.27 2.18.093.222.28.258.48.117.563-.41 1.02-1.172 1.137-1.898.14-.668.023-1.547-.293-2.18-.106-.258-.328-.293-.527-.094ZM8.01 16.86c.094.68.504 1.477 1.008 1.97.492.515 1.3.866 2.027.89.234.012.363-.14.328-.375-.117-.715-.527-1.477-1.031-1.934-.504-.48-1.277-.855-1.957-.937-.281-.035-.422.117-.375.386Zm6.715-1.007a3.872 3.872 0 0 0-1.735 1.289c-.421.55-.668 1.383-.644 2.11.023.222.176.339.41.304.703-.164 1.441-.668 1.816-1.278.387-.597.645-1.43.598-2.12 0-.282-.176-.4-.445-.305Zm-1.957-2.742c-.551.445-1.008 1.195-1.149 1.886-.035.211.082.375.305.387.726.023 1.559-.293 2.086-.762.527-.457.996-1.219 1.148-1.898.036-.258-.105-.434-.363-.422-.703.059-1.512.363-2.027.809ZM8.02 11.575a3.69 3.69 0 0 0 .492 2.157c.351.632 1.043 1.183 1.723 1.37.21.071.398-.046.421-.28.07-.669-.129-1.524-.504-2.133-.375-.586-1.043-1.149-1.664-1.395-.246-.105-.445 0-.468.281Zm5.39-2.402c-.668.234-1.36.762-1.734 1.371-.129.188-.059.387.152.48.668.27 1.547.27 2.215 0 .68-.257 1.383-.82 1.723-1.417.14-.211.07-.41-.188-.493-.668-.187-1.535-.175-2.168.059Zm-3.937-3.07c-.305.644-.422 1.511-.293 2.191.129.715.586 1.465 1.172 1.887.175.14.363.082.48-.13.305-.608.41-1.476.258-2.167-.14-.68-.586-1.43-1.078-1.899-.188-.164-.41-.117-.54.118Zm6.058-.305c-.691.129-1.453.574-1.886 1.113-.141.164-.106.364.082.492.62.364 1.5.48 2.191.293.691-.152 1.453-.609 1.898-1.125.176-.21.13-.421-.117-.527a3.795 3.795 0 0 0-2.168-.246Zm-3.457-3.61c-.398.598-.632 1.454-.586 2.133.012.715.364 1.524.88 2.04.175.164.374.14.503-.047.387-.598.621-1.454.563-2.133-.047-.668-.364-1.465-.809-2.016-.187-.21-.398-.187-.55.024Zm6.047-1.183c-.68.105-1.453.516-1.945.996s-.88 1.29-.961 1.969c-.023.234.105.375.34.363.715-.035 1.511-.41 2.004-.96.468-.493.855-1.278.96-1.981.024-.27-.117-.422-.398-.387Z"></path>
                  </svg>
                  <div className="flex flex-col mx-3 gap-1">
                    <h3 className="text-base font-medium text-white">AI Tax Practice Management Platform</h3>
                    <div className="flex gap-1 justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="#fd9b61" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star text-[#fd9b61]">
                        <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
                      </svg>
                      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="#fd9b61" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star text-[#fd9b61]">
                        <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
                      </svg>
                      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="#fd9b61" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star text-[#fd9b61]">
                        <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
                      </svg>
                      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="#fd9b61" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star text-[#fd9b61]">
                        <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
                      </svg>
                      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="#fd9b61" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star text-[#fd9b61]">
                        <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
                      </svg>
                    </div>
                  </div>
                  <svg className="h-8 fill-current text-stone-400 text-opacity-75 transition duration-300 group-hover:translate-x-1 group-hover:scale-105 group-hover:text-orange-300 group-hover:duration-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" aria-hidden="true">
                    <path d="M11.867 24.571c-.703.047-1.511.387-2.027.868-.176.164-.164.363.023.492.575.433 1.43.656 2.145.562.68-.047 1.488-.41 2.027-.89.211-.188.176-.41-.07-.551-.574-.352-1.418-.54-2.098-.48Zm-2.46-3.96c-.153-.223-.364-.235-.54-.024-.468.54-.808 1.348-.855 2.027-.07.727.176 1.582.633 2.121.152.188.34.188.492.012.457-.504.785-1.324.82-2.039.035-.68-.187-1.523-.55-2.098Zm5.765.785c-.656.222-1.348.761-1.723 1.359-.129.21-.07.387.153.469.668.281 1.558.281 2.215.011.644-.234 1.335-.785 1.722-1.382.14-.235.07-.434-.187-.516-.657-.2-1.535-.176-2.18.059Zm-3.375-3.188c-.21-.2-.422-.164-.527.094-.317.633-.434 1.512-.305 2.18.129.726.586 1.488 1.148 1.898.188.14.387.105.48-.117.317-.598.411-1.477.27-2.18-.14-.668-.562-1.418-1.066-1.875Zm8.309-1.348c.046-.27-.094-.421-.375-.386-.68.082-1.454.457-1.957.937-.504.457-.915 1.219-1.032 1.934-.035.234.094.387.328.375.727-.024 1.536-.375 2.028-.89.504-.493.914-1.29 1.008-1.97Zm-6.727-1.007c-.258-.094-.434.023-.434.304-.046.692.2 1.524.598 2.121.375.61 1.113 1.114 1.817 1.278.222.035.386-.082.398-.305.035-.727-.223-1.559-.633-2.11a3.843 3.843 0 0 0-1.746-1.288Zm1.957-2.742c-.504-.446-1.312-.75-2.016-.81-.27-.01-.398.165-.363.423.152.68.61 1.441 1.149 1.898.515.469 1.359.785 2.086.762.21-.012.34-.176.304-.387a3.44 3.44 0 0 0-1.16-1.886Zm4.758-1.536c-.035-.28-.223-.386-.469-.28-.633.245-1.3.808-1.664 1.394-.375.609-.586 1.464-.504 2.132.024.235.2.352.422.282.68-.188 1.371-.739 1.723-1.371a3.69 3.69 0 0 0 .492-2.157Zm-5.39-2.402c-.634-.234-1.5-.246-2.169-.059-.258.082-.328.282-.199.493.352.597 1.043 1.16 1.734 1.418.657.27 1.547.27 2.215 0 .211-.094.27-.293.153-.48-.375-.61-1.067-1.138-1.735-1.372Zm3.925-3.07c-.117-.235-.34-.282-.539-.118-.48.47-.926 1.22-1.066 1.899-.153.691-.059 1.559.257 2.168.106.21.305.27.48.129.575-.422 1.032-1.172 1.161-1.887.14-.68.023-1.547-.293-2.191Zm-6.059-.305c-.68-.14-1.535-.035-2.156.246-.246.106-.304.316-.129.527.457.516 1.22.973 1.899 1.125.703.188 1.582.07 2.191-.293.2-.128.235-.328.094-.492a3.425 3.425 0 0 0-1.899-1.113Zm3.47-3.61c-.153-.21-.376-.234-.552-.023-.445.55-.773 1.348-.808 2.016-.07.68.164 1.535.562 2.133.13.187.328.21.504.046.516-.515.867-1.324.88-2.039.046-.68-.188-1.535-.587-2.132ZM9.991 1.006c-.28-.035-.422.117-.398.387.105.703.492 1.488.96 1.98.493.551 1.29.926 2.005.961.234.012.363-.129.34-.363-.082-.68-.47-1.488-.973-1.969-.48-.48-1.254-.89-1.934-.996Z"></path>
                  </svg>
                </div>
              </div>
            </div>
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold mb-8 leading-[1.1] text-white" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay="600">
              Run Your Entire Tax Office With AI-Powered Precision
            </h1>
            <p className="mb-12 text-lg lg:text-xl text-zinc-300 max-w-xl leading-relaxed" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay="800">
              Experience the future of tax practice management. Our platform helps tax professionals organize, automate, and scale their firm with intelligent workflows, client management, and AI-driven efficiency.✨
            </p>
            <div className="mb-16" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay="1000">
              {isUserLoggedIn ? (
                <button
                  onClick={handleDashboardClick}
                  className="flex flex-col items-center justify-center w-32 h-32 rounded-full bg-white text-black hover:bg-zinc-100 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300 transform hover:scale-110 group relative border-2 border-zinc-200"
                  data-aos="zoom-in" data-aos-duration="800" data-aos-easing="ease-out-cubic" data-aos-delay="1200"
                >
                  <div className="absolute inset-0 rounded-full border-2 border-blue-500/0 group-hover:border-blue-500/50 transition-all duration-300 scale-110 opacity-0 group-hover:opacity-100"></div>
                  <span className="text-2xl font-bold text-blue-600 mb-1">{getUserInitials()}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-blue-500 transition-colors">Dashboard</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mt-1 translate-x-0 group-hover:translate-x-1 transition-transform">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => navigate("/create-account")}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-11 rounded-[10px] bg-white text-black hover:bg-zinc-100 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  data-aos="zoom-in" data-aos-duration="800" data-aos-easing="ease-out-cubic" data-aos-delay="1200"
                  style={{borderRadius: "10px"}}
                >
                  Get Started
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right ml-2">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-8 max-w-xl" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay="1400">
              <div className="group" data-aos="fade-up" data-aos-duration="800" data-aos-easing="ease-out-cubic" data-aos-delay="1600">
                <div className="text-2xl lg:text-3xl font-bold text-white group-hover:text-zinc-200 transition-colors duration-300">50M+</div>
                <div className="text-sm text-zinc-400 mt-1">Client Actions Processed</div>
              </div>
              <div className="group" data-aos="fade-up" data-aos-duration="800" data-aos-easing="ease-out-cubic" data-aos-delay="1800">
                <div className="text-2xl lg:text-3xl font-bold text-white group-hover:text-zinc-200 transition-colors duration-300">100K+</div>
                <div className="text-sm text-zinc-400 mt-1">Tax Professionals Supported</div>
              </div>
              <div className="group" data-aos="fade-up" data-aos-duration="800" data-aos-easing="ease-out-cubic" data-aos-delay="2000">
                <div className="text-2xl lg:text-3xl font-bold text-white group-hover:text-zinc-200 transition-colors duration-300">4.9/5</div>
                <div className="text-sm text-zinc-400 mt-1">User Rating</div>
              </div>
            </div>
          </div>
          <div className="relative hidden lg:block h-full w-full">
            <img
              src={heroImage}
              alt="Modern interior design showcase"
              className="absolute h-full w-full object-cover object-center left-0 top-0 right-0 bottom-0"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
          </div>
        </div>
      </main>
    </div>
  );
}