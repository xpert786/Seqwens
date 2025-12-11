import { useRef, useState } from "react";
export default function WhyChooseUs() {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const Icon1 = (
    <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="54" height="54" rx="15" fill="#00C0C6" />
      <path d="M31.6666 37.5V35.1667C31.6666 33.929 31.1749 32.742 30.2997 31.8668C29.4246 30.9917 28.2376 30.5 26.9999 30.5H19.9999C18.7622 30.5 17.5753 30.9917 16.7001 31.8668C15.8249 32.742 15.3333 33.929 15.3333 35.1667V37.5" stroke="white" strokeWidth="2" />
      <path d="M23.4999 25.8333C26.0772 25.8333 28.1666 23.744 28.1666 21.1667C28.1666 18.5893 26.0772 16.5 23.4999 16.5C20.9226 16.5 18.8333 18.5893 18.8333 21.1667C18.8333 23.744 20.9226 25.8333 23.4999 25.8333Z" stroke="white" strokeWidth="2" />
      <path d="M31.6667 25.8333L34.0001 28.1667L38.6667 23.5" stroke="white" strokeWidth="2" />
    </svg>
  );
  const Icon2 = (
    <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="54" height="54" rx="15" fill="#00C0C6" />
      <path d="M26.9999 38.6663C33.4432 38.6663 38.6666 33.443 38.6666 26.9997C38.6666 20.5564 33.4432 15.333 26.9999 15.333C20.5566 15.333 15.3333 20.5564 15.3333 26.9997C15.3333 33.443 20.5566 38.6663 26.9999 38.6663Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M26.9999 15.333C24.0042 18.4785 22.3333 22.6559 22.3333 26.9997C22.3333 31.3435 24.0042 35.5208 26.9999 38.6663C29.9956 35.5208 31.6666 31.3435 31.6666 26.9997C31.6666 22.6559 29.9956 18.4785 26.9999 15.333Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M15.3333 27H38.6666" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>

  );
  const Icon3 = (
    <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="54" height="54" rx="15" fill="#00C0C6" />
      <path d="M31.6666 37.5V35.1667C31.6666 33.929 31.1749 32.742 30.2997 31.8668C29.4246 30.9917 28.2376 30.5 26.9999 30.5H19.9999C18.7622 30.5 17.5753 30.9917 16.7001 31.8668C15.8249 32.742 15.3333 33.929 15.3333 35.1667V37.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M23.4999 25.8333C26.0772 25.8333 28.1666 23.744 28.1666 21.1667C28.1666 18.5893 26.0772 16.5 23.4999 16.5C20.9226 16.5 18.8333 18.5893 18.8333 21.1667C18.8333 23.744 20.9226 25.8333 23.4999 25.8333Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M31.6667 25.8333L34.0001 28.1667L38.6667 23.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>


  );
  const Icon4 = (
    <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="54" height="54" rx="15" fill="#00C0C6" />
      <path d="M29.9167 15.333H20.0001C19.3812 15.333 18.7878 15.5788 18.3502 16.0164C17.9126 16.454 17.6667 17.0475 17.6667 17.6663V36.333C17.6667 36.9518 17.9126 37.5453 18.3502 37.9829C18.7878 38.4205 19.3812 38.6663 20.0001 38.6663H34.0001C34.6189 38.6663 35.2124 38.4205 35.65 37.9829C36.0876 37.5453 36.3334 36.9518 36.3334 36.333V21.7497L29.9167 15.333Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M29.3333 15.333V22.333H36.3333" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M31.6666 28.167H22.3333" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M31.6666 32.833H22.3333" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M24.6666 23.5H22.3333" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>


  );

  const scrollRef = useRef(null);

 
  const scrollLeft = () => {
    if (scrollRef.current) {
      const cardWidth = window.innerWidth < 640 ? 180 : window.innerWidth < 768 ? 200 : 220;
      const gap = window.innerWidth < 640 ? 16 : window.innerWidth < 768 ? 24 : 32;
      scrollRef.current.scrollBy({ left: -(cardWidth + gap), behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const cardWidth = window.innerWidth < 640 ? 180 : window.innerWidth < 768 ? 200 : 220;
      const gap = window.innerWidth < 640 ? 16 : window.innerWidth < 768 ? 24 : 32;
      scrollRef.current.scrollBy({ left: cardWidth + gap, behavior: "smooth" });
    }
  };

  // Feature details data
  const featureDetails = {
    userManagement: {
      title: "User Management",
      icon: Icon1,
      description: "Comprehensive user management system with advanced security and access control features.",
      details: [
        "Role-based access control (RBAC) with customizable permissions",
        "Two-factor authentication (2FA) for enhanced security",
        "Granular permission settings for fine-tuned access control",
        "User activity tracking and audit logs",
        "Team member onboarding and offboarding workflows",
        "Multi-level user hierarchy support",
        "Single sign-on (SSO) integration capabilities"
      ],
      benefits: [
        "Enhanced security with 2FA and role-based permissions",
        "Improved compliance with detailed audit trails",
        "Streamlined team management and onboarding"
      ]
    },
    clientPortal: {
      title: "Taxpayer Portal",
      icon: Icon2,
      description: "Secure, branded taxpayer dashboards that provide real-time updates and seamless communication.",
      details: [
        "Fully customizable branded dashboards",
        "Real-time document and status updates",
        "Secure messaging and communication channels",
        "Self-service document upload and management",
        "Interactive forms and e-signature capabilities",
        "Mobile-responsive design for all devices",
        "Multi-language support for global clients"
      ],
      benefits: [
        "Improved taxpayer engagement and satisfaction",
        "Reduced administrative overhead",
        "Enhanced taxpayer experience with 24/7 access"
      ]
    },
    crmIntegration: {
      title: "CRM Integration",
      icon: Icon3,
      description: "Comprehensive relationship management with timeline views and seamless integrations.",
      details: [
        "Complete taxpayer relationship management system",
        "Interactive timeline views for taxpayer interactions",
        "Integration with popular CRM platforms",
        "Automated contact and lead management",
        "Taxpayer communication history tracking",
        "Customizable pipeline and workflow management",
        "Advanced reporting and analytics"
      ],
      benefits: [
        "Centralized taxpayer information management",
        "Better taxpayer relationship tracking",
        "Improved sales and service coordination"
      ]
    },
    documentManagement: {
      title: "Document Management",
      icon: Icon4,
      description: "Advanced document handling system with e-signatures, version control, and intelligent organization.",
      details: [
        "Advanced OCR (Optical Character Recognition) technology",
        "Electronic signature (e-signature) capabilities",
        "Version control and document history tracking",
        "Secure folder sharing and collaboration",
        "Automated document categorization and tagging",
        "Cloud storage with unlimited capacity",
        "Document encryption and secure access controls"
      ],
      benefits: [
        "Streamlined document workflows",
        "Enhanced security and compliance",
        "Improved collaboration and efficiency"
      ]
    }
  };

  const handleLearnMore = (featureKey) => {
    setSelectedFeature(featureDetails[featureKey]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFeature(null);
  };

  return (
    <section className="py-6 sm:py-8 md:py-10 px-3 sm:px-4 md:px-6 overflow-visible">
      <div className="max-w-9xl mx-auto bg-[#3B4A66] rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-14 lg:p-20 relative overflow-visible">

        {/* TOP */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6">
          <div className="flex-1 w-full sm:w-auto">
            <p className="text-white text-xs sm:text-sm mb-2 sm:mb-3">Features</p>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight sm:leading-snug">
              EVERYTHING YOU NEED IN <br className="hidden sm:block" />
              <span className="text-[#F49C2D]">ONE PLATFORM</span>
            </h2>
            <p className="text-[#D1D5DB] text-xs sm:text-sm mt-2 sm:mt-3 max-w-md">
              From taxpayer onboarding to final billing, our comprehensive platform
              handles every aspect of your tax practice.
            </p>
          </div>

        
          {/* ARROW BUTTONS */}
          <div className="flex gap-2 sm:gap-3 mt-0 sm:mt-0 self-start sm:self-auto !mt-20">
            <button onClick={scrollLeft} className="hover:opacity-80 transition-opacity active:opacity-70">
              <svg className="w-8 h-6 sm:w-10 sm:h-7 md:w-12 md:h-8" viewBox="0 0 42 30" fill="none">
                <rect width="42" height="30" rx="15" fill="#F56D2D" />
                <path d="M19 19L15 15M15 15L19 11M15 15H27" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            <button onClick={scrollRight} className="hover:opacity-80 transition-opacity active:opacity-70">
              <svg className="w-8 h-6 sm:w-10 sm:h-7 md:w-12 md:h-8" viewBox="0 0 42 30" fill="none">
                <rect width="42" height="30" rx="15" transform="matrix(-1 0 0 1 42 0)" fill="#F56D2D" />
                <path d="M23 19L27 15M27 15L23 11M27 15H15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* FIXED HORIZONTAL CARD SCROLLER */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 md:gap-8 mt-8 sm:mt-12 md:mt-16 overflow-x-auto scrollbar-hide -mx-6 sm:-mx-10 md:-mx-14 lg:-mx-20 px-6 sm:px-10 md:px-14 lg:px-20"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >

          {/* CARD 1 */}
          <div className="min-w-[180px] sm:min-w-[200px] md:min-w-[220px] bg-[#FFF4E6] border border-[#F5D8BB] rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-7 h-[280px] sm:h-[300px] md:h-[330px] flex flex-col flex-shrink-0">
            <div className="scale-75 sm:scale-90 md:scale-100 origin-top-left">{Icon1}</div>
            <h3 className="!text-base sm:!text-lg md:!text-xl !font-bold text-[#3B4A66] !mt-4 sm:!mt-6 md:!mt-10 leading-tight">USER MANAGEMENT</h3>
            <p className="text-xs sm:text-sm text-[#3B4A66] mt-2 sm:mt-3 flex-grow">Role-based access control with 2FA and granular permissions.</p>
            <button 
              onClick={() => handleLearnMore('userManagement')}
              className="mt-auto px-3 py-1.5 sm:py-2 bg-[#F56D2D] text-white !rounded-lg text-xs sm:text-sm w-fit hover:bg-[#E55D1D] transition-colors active:scale-95"
            >
              Learn More
            </button>

          </div>
          

          {/* CARD 2 */}
          <div className="min-w-[180px] sm:min-w-[200px] md:min-w-[220px] bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-7 border border-gray-100 h-[280px] sm:h-[300px] md:h-[330px] flex flex-col flex-shrink-0">
            <div className="scale-75 sm:scale-90 md:scale-100 origin-top-left">{Icon2}</div>
            <h3 className="!text-base sm:!text-lg md:!text-xl !font-bold text-[#3B4A66] !mt-4 sm:!mt-6 md:!mt-10 leading-tight">TAXPAYER PORTAL</h3>
            <p className="text-xs sm:text-sm text-[#3B4A66] mt-2 sm:mt-3 flex-grow">Secure, branded dashboards with real-time updates.</p>
            <button 
              onClick={() => handleLearnMore('clientPortal')}
              className="mt-auto px-3 py-1.5 sm:py-2 bg-[#F56D2D] text-white !rounded-lg text-xs sm:text-sm w-fit hover:bg-[#E55D1D] transition-colors active:scale-95"
            >
              Learn More
            </button>
          </div>

          {/* CARD 3 */}
          <div className="min-w-[180px] sm:min-w-[200px] md:min-w-[220px] bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-7 border border-gray-100 h-[280px] sm:h-[300px] md:h-[330px] flex flex-col flex-shrink-0">
            <div className="scale-75 sm:scale-90 md:scale-100 origin-top-left">{Icon3}</div>
            <h3 className="!text-base sm:!text-lg md:!text-xl !font-bold text-[#1F2A55] !mt-4 sm:!mt-6 md:!mt-10 leading-tight">CRM INTEGRATION</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3 flex-grow">Comprehensive relationship management with timeline views.</p>
            <button 
              onClick={() => handleLearnMore('crmIntegration')}
              className="mt-auto px-3 py-1.5 sm:py-2 bg-[#F56D2D] text-white !rounded-lg text-xs sm:text-sm w-fit hover:bg-[#E55D1D] transition-colors active:scale-95"
            >
              Learn More
            </button>
          </div>

          {/* CARD 4 */}
          <div className="min-w-[180px] sm:min-w-[200px] md:min-w-[220px] bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-7 border border-gray-100 h-[280px] sm:h-[300px] md:h-[330px] flex flex-col flex-shrink-0">
            <div className="scale-75 sm:scale-90 md:scale-100 origin-top-left">{Icon4}</div>
            <h3 className="!text-base sm:!text-lg md:!text-xl !font-bold text-[#1F2A55] !mt-4 sm:!mt-6 md:!mt-10 leading-tight">DOCUMENT MANAGEMENT</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 flex-grow">Advanced document handling with e-signatures and version control.</p>
            <button 
              onClick={() => handleLearnMore('documentManagement')}
              className="mt-auto px-3 py-1.5 sm:py-2 bg-[#F56D2D] text-white !rounded-lg text-xs sm:text-sm w-fit hover:bg-[#E55D1D] transition-colors active:scale-95"
            >
              Learn More
            </button>
          </div>

          
         
       
         
        </div>
      </div>

      {/* Feature Details Modal */}
      {showModal && selectedFeature && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
            style={{
              borderRadius: '12px',
              border: '1px solid #E8F0FF'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start p-6 border-b border-[#E8F0FF] bg-[#F9FBFF]">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {selectedFeature.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                    {selectedFeature.title}
                  </h2>
                  <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">
                    {selectedFeature.description}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5L5 15M5 5L15 15" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Key Features */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                  Key Features
                </h3>
                <ul className="space-y-3">
                  {selectedFeature.details.map((detail, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-[#3AD6F2] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Benefits */}
              <div className="bg-[#F0FAFD] rounded-lg p-4 border border-[#E8F0FF]">
                <h3 className="text-lg font-semibold mb-3 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                  Benefits
                </h3>
                <ul className="space-y-2">
                  {selectedFeature.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-[#3AD6F2] font-bold">•</span>
                      <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-[#E8F0FF]">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E66F2F] transition-colors font-[BasisGrotesquePro] text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}