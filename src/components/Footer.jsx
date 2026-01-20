import { Link } from "react-router-dom";
import seqwensLogo from "../assets/seqwlogo.png.png";

export default function Footer() {
    return (
        <footer className="w-full text-white rounded-t-2xl sm:rounded-t-3xl">
            <div className="max-w-[1300px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-8 sm:py-10 md:py-12 lg:py-16">
                <div className="flex justify-center items-start">

                    {/* Left Section - Company Info and Social Media (White Box) */}
                    <div className="w-full max-w-[420px]">
                        <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 lg:p-10 shadow-sm">
                            {/* Logo */}
                            <Link to="/" className="flex items-center gap-2 mb-3 sm:mb-4">
                                <img
                                    src={seqwensLogo}
                                    alt="SeQwens Logo"
                                    className="h-6 sm:h-7 md:h-8 w-auto"
                                />
                            </Link>

                            {/* Description */}
                            <p className="text-[#3D4756] text-xs sm:text-sm md:text-base mb-4 sm:mb-5 md:mb-6 font-[BasisGrotesquePro] leading-relaxed">
                                The complete tax practice management platform designed for modern tax professionals. Streamline your workflow, secure your data, and grow your practice.
                            </p>

                            {/* Follow us */}
                            <p className="text-[#3D4756] text-xs sm:text-sm font-[BasisGrotesquePro] mb-2 sm:mb-3">
                                Follow us on:
                            </p>

                            {/* Social Media Icons */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                <a
                                    href="https://facebook.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center hover:bg-[#FF6A1E] transition-colors"
                                    aria-label="Facebook"
                                >
                                    <svg className="w-8 h-8 sm:w-9 sm:h-9 md:w-[36px] md:h-[36px]" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="0.5" y="0.5" width="35" height="35" rx="8.5" fill="#FFF4E6" />
                                        <rect x="0.5" y="0.5" width="35" height="35" rx="8.5" stroke="#E8F0FF" />
                                        <path d="M28 18C28 12.48 23.52 8 18 8C12.48 8 8 12.48 8 18C8 22.84 11.44 26.87 16 27.8V21H14V18H16V15.5C16 13.57 17.57 12 19.5 12H22V15H20C19.45 15 19 15.45 19 16V18H22V21H19V27.95C24.05 27.45 28 23.19 28 18Z" fill="#F56D2D" />
                                    </svg>

                                </a>

                                <a
                                    href="https://linkedin.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center hover:bg-[#FF6A1E] transition-colors"
                                    aria-label="LinkedIn"
                                >
                                    <svg className="w-8 h-8 sm:w-9 sm:h-9 md:w-[36px] md:h-[36px]" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="0.5" y="0.5" width="35" height="35" rx="8.5" fill="#FFF4E6" />
                                        <rect x="0.5" y="0.5" width="35" height="35" rx="8.5" stroke="#E8F0FF" />
                                        <path d="M10.75 7.875C10.1864 7.875 9.64591 8.09888 9.2474 8.4974C8.84888 8.89591 8.625 9.43641 8.625 10C8.625 10.5636 8.84888 11.1041 9.2474 11.5026C9.64591 11.9011 10.1864 12.125 10.75 12.125C11.3136 12.125 11.8541 11.9011 12.2526 11.5026C12.6511 11.1041 12.875 10.5636 12.875 10C12.875 9.43641 12.6511 8.89591 12.2526 8.4974C11.8541 8.09888 11.3136 7.875 10.75 7.875ZM8.75 13.875C8.71685 13.875 8.68505 13.8882 8.66161 13.9116C8.63817 13.9351 8.625 13.9668 8.625 14V27C8.625 27.069 8.681 27.125 8.75 27.125H12.75C12.7832 27.125 12.8149 27.1118 12.8384 27.0884C12.8618 27.0649 12.875 27.0332 12.875 27V14C12.875 13.9668 12.8618 13.9351 12.8384 13.9116C12.8149 13.8882 12.7832 13.875 12.75 13.875H8.75ZM15.25 13.875C15.2168 13.875 15.1851 13.8882 15.1616 13.9116C15.1382 13.9351 15.125 13.9668 15.125 14V27C15.125 27.069 15.181 27.125 15.25 27.125H19.25C19.2832 27.125 19.3149 27.1118 19.3384 27.0884C19.3618 27.0649 19.375 27.0332 19.375 27V20C19.375 19.5027 19.5725 19.0258 19.9242 18.6742C20.2758 18.3225 20.7527 18.125 21.25 18.125C21.7473 18.125 22.2242 18.3225 22.5758 18.6742C22.9275 19.0258 23.125 19.5027 23.125 20V27C23.125 27.069 23.181 27.125 23.25 27.125H27.25C27.2832 27.125 27.3149 27.1118 27.3384 27.0884C27.3618 27.0649 27.375 27.0332 27.375 27V18.38C27.375 15.953 25.265 14.055 22.85 14.274C22.1029 14.3425 21.371 14.5274 20.681 14.822L19.375 15.382V14C19.375 13.9668 19.3618 13.9351 19.3384 13.9116C19.3149 13.8882 19.2832 13.875 19.25 13.875H15.25Z" fill="#F56D2D" />
                                    </svg>

                                </a>

                                <a
                                    href="https://twitter.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className=" flex items-center justify-center hover:bg-[#FF6A1E] transition-colors"
                                    aria-label="X (Twitter)"
                                >
                                    <svg className="w-8 h-8 sm:w-9 sm:h-9 md:w-[36px] md:h-[36px]" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="0.5" y="0.5" width="35" height="35" rx="8.5" fill="#FFF4E6" />
                                        <rect x="0.5" y="0.5" width="35" height="35" rx="8.5" stroke="#E8F0FF" />
                                        <path d="M23.6871 9.06299L18.6911 14.774L14.3711 9.06299H8.11206L15.5891 18.839L8.50306 26.938H11.5371L17.0061 20.688L21.7861 26.938H27.8881L20.0941 16.634L26.7191 9.06299H23.6871ZM22.6231 25.123L11.6541 10.782H13.4571L24.3031 25.122L22.6231 25.123Z" fill="#F56D2D" />
                                    </svg>

                                </a>

                                <a
                                    href="https://instagram.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className=" flex items-center justify-center hover:bg-[#FF6A1E] transition-colors"
                                    aria-label="Instagram"
                                >
                                    <svg className="w-8 h-8 sm:w-9 sm:h-9 md:w-[36px] md:h-[36px]" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="0.5" y="0.5" width="35" height="35" rx="8.5" fill="#FFF4E6" />
                                        <rect x="0.5" y="0.5" width="35" height="35" rx="8.5" stroke="#E8F0FF" />
                                        <path d="M21 9.5H15C11.9624 9.5 9.5 11.9624 9.5 15V21C9.5 24.0376 11.9624 26.5 15 26.5H21C24.0376 26.5 26.5 24.0376 26.5 21V15C26.5 11.9624 24.0376 9.5 21 9.5Z" stroke="#F56D2D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M18 21.606C19.9916 21.606 21.606 19.9916 21.606 18C21.606 16.0085 19.9916 14.394 18 14.394C16.0085 14.394 14.394 16.0085 14.394 18C14.394 19.9916 16.0085 21.606 18 21.606Z" stroke="#F56D2D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M22.894 14.1362C23.4629 14.1362 23.924 13.675 23.924 13.1062C23.924 12.5373 23.4629 12.0762 22.894 12.0762C22.3252 12.0762 21.864 12.5373 21.864 13.1062C21.864 13.675 22.3252 14.1362 22.894 14.1362Z" fill="#F56D2D" />
                                    </svg>

                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* White divider line */}
                <hr className="!mt-8 sm:!mt-10 md:!mt-12 border-t border-white" />

                {/* Bottom Section - Copyright and Policy Links */}
                <div className="pt-4 pb-4 sm:pt-5 sm:pb-5 md:py-5 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
                    <p className="text-white text-xs sm:text-sm font-[BasisGrotesquePro] text-center sm:text-left">
                        © 2026 SeQwens. All rights reserved.
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 text-xs sm:text-sm font-[BasisGrotesquePro]">
                        <Link to="/privacy" className="text-white hover:text-white/90 transition-colors">
                            Privacy Policy
                        </Link>

                        <Link to="/terms" className="text-white hover:text-white/90 transition-colors">
                            Terms of Service
                        </Link>

                        <Link to="/cookies" className="text-white hover:text-white/90 transition-colors">
                            Cookies Policy
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
