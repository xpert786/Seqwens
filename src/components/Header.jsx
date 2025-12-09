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
  const [userData, setUserData] = useState(() => {
    if (isLoggedIn()) {
      return getUserData();
    }
    return null;
  });

  const isActive = (path) => location.pathname === path;

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
    if (!isUserLoggedIn || !userData) return;

    const storage = getStorage();
    const userType = storage?.getItem("userType") || userData?.user_type;

    if (userType === 'super_admin' || userType === 'support_admin' || userType === 'billing_admin') {
      navigate("/superadmin");
    } else if (userType === 'admin') {
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
    <header className="w-full  bg-white">
      <div className="w-full pl-6 md:pl-8 lg:pl-12 xl:pl-16 2xl:pl-20 pr-4 md:pr-6 lg:pr-8 xl:pr-10 2xl:pr-12 py-3 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center cursor-pointer flex-shrink-0">
          <img
            src={seqwensLogo}
            alt="SeQwens Logo"
            className="h-8 md:h-9 lg:h-10 w-auto max-w-[180px] object-contain"
          />
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          <Link
            to="/"
            className="text-lg !text-[#3AD6F2] font-[BasisGrotesquePro]"
          >
            Home
          </Link>

          <Link
            to="/capabilities"
            className="text-lg text-black font-[BasisGrotesquePro]"
          >
            AI Capabilities
          </Link>

          <Link
            to="/pricing"
            className="text-lg text-black font-[BasisGrotesquePro]"
          >
            Pricing
          </Link>

          <Link
            to="/case-studies"
            className="text-lg text-black font-[BasisGrotesquePro]"
          >
            Case Studies
          </Link>
        </nav>

        {/* Right Buttons */}
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
            <Link to="/login" className="text-lg text-black font-[BasisGrotesquePro]">
              Sign In
            </Link>
          )}

          <button className="bg-[#FF7A2E] text-white text-sm px-3 py-2 !rounded-md font-[BasisGrotesquePro]">
            Contact Sales
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="text-2xl">☰</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white px-4 pb-4 space-y-4 border-t">
          <Link
            to="/"
            className="block text-[#3AD6F2] font-[BasisGrotesquePro]"
          >
            Home
          </Link>
          <Link
            to="/capabilities"
            className="block text-black font-[BasisGrotesquePro]"
          >
            AI Capabilities
          </Link>
          <Link
            to="/pricing"
            className="block text-black font-[BasisGrotesquePro]"
          >
            Pricing
          </Link>
          <Link
            to="/case-studies"
            className="block text-black font-[BasisGrotesquePro]"
          >
            Case Studies
          </Link>

          {isUserLoggedIn ? (
            <button
              onClick={handleUserLogoClick}
              className="w-10 h-10 rounded-full bg-[#3AD6F2] text-white flex items-center justify-center font-semibold font-[BasisGrotesquePro] hover:bg-[#2BC5E0] transition-colors cursor-pointer mx-auto"
              title="Go to Dashboard"
            >
              {getUserInitials()}
            </button>
          ) : (
            <Link to="/login" className="block text-black font-[BasisGrotesquePro]">
              Sign In
            </Link>
          )}

          <button className="bg-[#FF7A2E] text-white w-full py-2 rounded-md font-[BasisGrotesquePro]">
            Contact Sales
          </button>
        </div>
      )}
    </header>
  );
}
