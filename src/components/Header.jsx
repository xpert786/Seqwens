import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import seqwensLogo from "../assets/seqwlogo.png.png";

export default function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

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
          <Link to="/login" className="text-lg text-black font-[BasisGrotesquePro]">
            Sign In
          </Link>

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

          <Link to="/signin" className="block text-black font-[BasisGrotesquePro]">
            Sign In
          </Link>

          <button className="bg-[#FF7A2E] text-white w-full py-2 rounded-md font-[BasisGrotesquePro]">
            Contact Sales
          </button>
        </div>
      )}
    </header>
  );
}
