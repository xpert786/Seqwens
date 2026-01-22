import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import seqwensLogo from "../assets/seqwlogo.png.png";
import { isLoggedIn, getUserData, getStorage } from "../ClientOnboarding/utils/userUtils";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize with actual login status
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(() => isLoggedIn());
  const [headerOpacity, setHeaderOpacity] = useState(1);
  // const [headerTransform, setHeaderTransform] = useState("none");
  const [userData, setUserData] = useState(() => {
    if (isLoggedIn()) {
      return getUserData();
    }
    return null;
  });

  const handleClientPortalClick = (e) => {
    e.preventDefault();
    if (location.pathname === "/") {
      window.location.hash = "#client-portal";
    } else {
      navigate("/#client-portal");
    }
  };

  const handleGetStartedClick = (e) => {
    e.preventDefault();
    if (location.pathname === "/") {
      window.location.hash = "#get-started";
    } else {
      navigate("/#get-started");
    }
  };

  // Add scroll effect for transparency (optional)
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop > 100) {
        setHeaderOpacity(1);
      } else {
        setHeaderOpacity(1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  // Handle navigation to FAQ section
  const handleFAQClick = (e) => {
    e.preventDefault();
    if (location.pathname === "/") {
      // If on home page, scroll to section
      const element = document.getElementById("faq");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      // If on another page, navigate to home with hash
      navigate("/#faq");
      // Wait for navigation then scroll
      setTimeout(() => {
        const element = document.getElementById("faq");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  const handlePricingClick = (e) => {
    e.preventDefault();
    if (location.pathname === "/") {
      const element = document.getElementById("pricing");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      navigate("/#pricing");
      setTimeout(() => {
        const element = document.getElementById("pricing");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  // Handle hash navigation on page load
  useEffect(() => {
    if (location.pathname === "/") {
      const hash = window.location.hash;
      if (hash === "#capabilities") {
        setTimeout(() => {
          const element = document.getElementById("capabilities");
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      } else if (hash === "#pricing") {
        setTimeout(() => {
          const element = document.getElementById("pricing");
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      } else if (hash === "#faq") {
        setTimeout(() => {
          const element = document.getElementById("faq");
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      }
    }
  }, [location.pathname]);

  // Check if user is logged in
  useEffect(() => {
    const checkAndUpdate = () => {
      const loggedIn = isLoggedIn();
      setIsUserLoggedIn(loggedIn);

      if (loggedIn) {
        const user = getUserData();
        setUserData(user);
      } else {
        setUserData(null);
      }
    };

    // Check immediately
    checkAndUpdate();

    // Check periodically in case login status changes
    const interval = setInterval(checkAndUpdate, 1000);

    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', checkAndUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkAndUpdate);
    };
  }, [location.pathname]);

  // Navigate to user's dashboard based on user type
  const handleUserLogoClick = () => {
    if (!isUserLoggedIn || !userData) {
      // If not logged in, go to home page
      navigate("/");
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
    } else if (userType === 'client' || !userType) {
      // Check if client is verified and completed
      const isEmailVerified = userData.is_email_verified;
      const isPhoneVerified = userData.is_phone_verified;
      const isCompleted = userData.is_completed;

      if (!isEmailVerified && !isPhoneVerified) {
        navigate("/two-auth");
      } else if (isCompleted) {
        navigate("/dashboard");
      } else {
        navigate("/dashboard-first");
      }
    } else {
      navigate("/dashboard");
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userData) return "U";
    const firstName = userData.first_name || userData.name || "";
    const lastName = userData.last_name || "";
    const email = userData.email || "";

    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName[0].toUpperCase();
    } else if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <header data-aos="fade-down" data-aos-duration="800" data-aos-delay="400"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-black/20 backdrop-blur-md border-b border-white/10}`}
      style={{ opacity: headerOpacity /*, transform: headerTransform*/ }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          {isUserLoggedIn ? (
            <button
              onClick={handleUserLogoClick}
              className="flex items-center cursor-pointer flex-shrink-0 bg-transparent border-none p-0"
            >
              <img
                src={seqwensLogo}
                alt="SeQwens Logo"
                className="h-8 md:h-9 lg:h-10 w-auto max-w-[180px] object-contain"
              />
            </button>
          ) : (
            <Link
              to="/"
              className="flex items-center cursor-pointer flex-shrink-0"
            >
              <img
                src={seqwensLogo}
                alt="SeQwens Logo"
                className="h-8 md:h-9 lg:h-10 w-auto max-w-[180px] object-contain"
              />
            </Link>
          )}

          {/* Desktop Menu - Dynamic with underline animation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Pricing */}
            <div style={{ opacity: 1, transform: "none" }}>
              <a
                href={location.pathname === "/" ? "#pricing" : "/#pricing"}
                onClick={handlePricingClick}
                className={`text-sm font-medium transition-colors duration-200 relative group ${location.pathname === "/" && window.location.hash === "#pricing"
                  ? "text-white"
                  : "text-zinc-200 hover:text-white"
                  }`}
              >
                Pricing
                <span className={`absolute inset-x-0 -bottom-1 h-0.5 ${location.pathname === "/" && window.location.hash === "#pricing" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  } transition-transform duration-200 bg-white`}></span>
              </a>
            </div>

            {/* FAQ - Note: Your original has FAQ mapped to Client Portal */}
            <div style={{ opacity: 1, transform: "none" }}>
              <a
                href={location.pathname === "/" ? "#faq" : "/#faq"}
                onClick={handleFAQClick}
                className={`text-sm font-medium transition-colors duration-200 relative group text-white ${location.pathname === "/" && window.location.hash === "#faq"
                  ? "text-white"
                  : "text-zinc-200 hover:text-white"
                  }`}
              >
                FAQ
                <span className={`absolute inset-x-0 -bottom-1 h-0.5 ${location.pathname === "/" && window.location.hash === "#faq" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  } transition-transform duration-200 bg-white`}></span>
              </a>
            </div>

            {/* Client Portal - Dynamic link based on login status */}
            <div style={{ opacity: 1, transform: "none" }}>
              {isUserLoggedIn ? (
                <button
                  onClick={handleUserLogoClick}
                  className="text-sm font-medium transition-colors duration-200 relative group text-white hover:text-white"
                >
                  Client Portal
                  <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="text-sm font-medium transition-colors duration-200 relative group text-white hover:text-white"
                >
                  Client Portal
                  <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
                </Link>
              )}
            </div>

            {/* Get Started - Shows 3D Floor Plan when logged in, Get Started when not */}
            <div style={{ opacity: 1, transform: "none" }}>
              {isUserLoggedIn ? (
                <Link
                  to="/floor-plan-creator"
                  className={`text-sm font-medium transition-colors duration-200 relative group ${location.pathname === "/floor-plan-creator"
                    ? "text-white"
                    : "text-zinc-200 hover:text-white"
                    }`}
                >
                  3D Floor Plan
                  <span className={`absolute inset-x-0 -bottom-1 h-0.5 ${location.pathname === "/floor-plan-creator" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    } transition-transform duration-200 bg-white`}></span>
                </Link>
              ) : (
                <Link
                  to="/create-account"
                  className={`text-sm font-medium transition-colors duration-200 relative group ${location.pathname === "/create-account"
                    ? "text-white"
                    : "text-zinc-200 hover:text-white"
                    }`}
                >
                  Get Started
                  <span className={`absolute inset-x-0 -bottom-1 h-0.5 ${location.pathname === "/create-account" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    } transition-transform duration-200 bg-white`}></span>
                </Link>
              )}
            </div>
          </nav>

          {/* Right Buttons - Dynamic */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {isUserLoggedIn ? (
              <button
                onClick={handleUserLogoClick}
                className="w-10 h-10 rounded-full bg-[#3AD6F2] text-white flex items-center justify-center font-semibold font-[BasisGrotesquePro] hover:bg-[#2BC5E0] transition-colors cursor-pointer"
                title="Go to Dashboard"
              >
                {getUserInitials()}
              </button>
            ) : (
              <Link
                to="/login"
                className="bg-white/90 text-black px-6 py-2.5 rounded-[10px] font-semibold text-sm hover:bg-white transition-colors duration-200 shadow-lg backdrop-blur-sm"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="flex md:hidden text-white hover:text-zinc-300 p-2 rounded-lg hover:bg-white/5 transition-colors duration-200"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            <div style={{ opacity: 1, transform: "none" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-menu h-6 w-6"
              >
                <line x1="4" x2="20" y1="12" y2="12"></line>
                <line x1="4" x2="20" y1="6" y2="6"></line>
                <line x1="4" x2="20" y1="18" y2="18"></line>
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-md px-6 pb-4 space-y-4">
          <Link
            to="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-white font-medium py-2"
          >
            Pricing
          </Link>

          <a
            href="#faq"
            onClick={(e) => {
              handleFAQClick(e);
              setMobileMenuOpen(false);
            }}
            className={`block font-medium py-2 ${location.pathname === "/" && window.location.hash === "#faq"
              ? "text-[#3AD6F2]"
              : "text-white hover:text-[#3AD6F2]"
              }`}
          >
            FAQ
          </a>

          {isUserLoggedIn ? (
            <button
              onClick={() => {
                handleUserLogoClick();
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left text-white font-medium py-2 hover:text-[#3AD6F2]"
            >
              Client Portal
            </button>
          ) : (
            <a
              href="#client-portal"
              onClick={(e) => {
                handleClientPortalClick(e);
                setMobileMenuOpen(false);
              }}
              className="block text-white font-medium py-2 hover:text-[#3AD6F2]"
            >
              Client Portal
            </a>
          )}

          {isUserLoggedIn ? (
            <Link
              to="/floor-plan-creator"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-white font-medium py-2 hover:text-[#3AD6F2]"
            >
              3D Floor Plan
            </Link>
          ) : (
            <a
              href="#get-started"
              onClick={(e) => {
                handleGetStartedClick(e);
                setMobileMenuOpen(false);
              }}
              className="block text-white font-medium py-2 hover:text-[#3AD6F2]"
            >
              Get Started
            </a>
          )}

          {isUserLoggedIn ? (
            <button
              onClick={() => {
                handleUserLogoClick();
                setMobileMenuOpen(false);
              }}
              className="w-10 h-10 rounded-full bg-[#3AD6F2] text-white flex items-center justify-center font-semibold mx-auto"
            >
              {getUserInitials()}
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-white font-medium py-2"
            >
              Sign In
            </Link>
          )}


        </div>
      )}
    </header>
  );
}
