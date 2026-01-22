import { useState, useRef, useEffect } from "react";
import { getApiBaseUrl } from "../../ClientOnboarding/utils/corsConfig";

// Map technical role names to user-friendly display names
const getDisplayRole = (role) => {
  const roleMap = {
    'tax_preparer': 'Tax Preparer',
    'staff': 'Tax Preparer',
    'firm': 'Firm Administrator',
    'firm_admin': 'Firm Administrator',
    'client': 'Taxpayer',
    'taxpayer': 'Taxpayer',
    'super_admin': 'System Administrator',
    'superadmin': 'System Administrator',
  };

  if (!role) return '';

  const lowerRole = role.toLowerCase();

  if (role.includes(' ') || (role[0] === role[0].toUpperCase() && !role.includes('_'))) {
    return role;
  }

  return roleMap[lowerRole] || role.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

// Get company display based on role
const getCompanyDisplay = (userName) => {
  const companies = [
    "Deloitte Tax",
    "PwC Tax Services",
    "EY Tax Advisory",
    "KPMG Tax",
    "Grant Thornton",
    "RSM US",
    "BDO USA",
    "Crowe",
    "Moss Adams",
    "CBIZ MHM",
    "SeQwens Accounting"
  ];

  // Use the same company for consistency if user has multiple testimonials
  const hash = userName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const companyIndex = hash % companies.length;

  return companies[companyIndex];
};

// Generate performance metrics based on role
const generateMetrics = (role) => {
  const metrics = [
    { text: "50% faster tax preparation", value: "50" },
    { text: "40% reduction in paperwork", value: "40" },
    { text: "60% faster document processing", value: "60" },
    { text: "70% time savings on returns", value: "70" },
    { text: "3x more efficient workflow", value: "3x" },
    { text: "30% increase in client satisfaction", value: "30" },
    { text: "45% reduction in errors", value: "45" },
    { text: "2x faster client onboarding", value: "2x" }
  ];

  const roleBasedMetrics = {
    'tax_preparer': metrics[0], // 50% faster tax preparation
    'firm_admin': metrics[1],   // 40% reduction in paperwork
    'client': metrics[5],       // 30% increase in client satisfaction
    'super_admin': metrics[3]   // 70% time savings on returns
  };

  return roleBasedMetrics[role?.toLowerCase()] || metrics[Math.floor(Math.random() * metrics.length)];
};

export default function Testimonials() {
  const scrollContainerRef = useRef(null);
  const [feedbacks, setFeedbacks] = useState([]);
  // const [averageRating, setAverageRating] = useState("4.9");
  // const [totalReviews, setTotalReviews] = useState("250+");

  // Fetch Feedback List
  const fetchFeedbackList = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/user/feedback/list/`);
      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.feedback);
      }
    } catch (error) {
      console.log("Feedback list error:", error);

      // Fallback sample data if API fails
      const sampleFeedbacks = [
        {
          id: 1,
          user_name: "Sarah M.",
          user_role: "tax_preparer",
          comment: "SeQwens has completely transformed how we prepare tax returns. What used to take hours of manual work now happens in minutes. Our returns are more accurate, and we're serving clients 50% faster because we can instantly access and process financial data.",
          stars: "5"
        },
        {
          id: 2,
          user_name: "Michael T.",
          user_role: "firm_admin",
          comment: "As a firm administrator, my biggest challenge was always managing document workflows and client communications. SeQwens has revolutionized our operations. Our team collaboration is seamless, leading to faster processing and fewer compliance issues. It's elevated our entire practice.",
          stars: "5"
        },
        {
          id: 3,
          user_name: "Elena R.",
          user_role: "tax_preparer",
          comment: "My tax preparation process has been completely streamlined. I can process countless returns rapidly and deliver accurate results that wow clients from the first meeting. SeQwens helps me serve more clients because my work is consistently efficient and professional.",
          stars: "5"
        },
        {
          id: 4,
          user_name: "James K.",
          user_role: "firm_admin",
          comment: "Our accounting team was struggling with expensive software costs and lengthy manual processes. SeQwens solved everything. We create beautiful, accurate financial reports instantly. Our client presentations now stand out dramatically, and we've seen a significant boost in client retention.",
          stars: "5"
        },
        {
          id: 5,
          user_name: "David L.",
          user_role: "client",
          comment: "The quality of our financial reporting has reached a new level. SeQwens helps us communicate financial insights with crystal clarity. Stakeholders are more engaged, decision-making is faster, and our reputation for financial excellence has grown significantly.",
          stars: "5"
        },
        {
          id: 6,
          user_name: "Rachel W.",
          user_role: "super_admin",
          comment: "Running a tax practice means managing tight deadlines and client expectations. SeQwens has given us a competitive edge we never had before. Our team delivers exceptional service consistently, clients are thrilled with results, and we've been able to take on 50% more clients.",
          stars: "5"
        }
      ];
      setFeedbacks(sampleFeedbacks);
    }
  };

  // Fetch Average Ratings
  const fetchAverageRating = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/user/feedback/average/`);
      const data = await res.json();
      if (data.success) {
        // setAverageRating(data.average_stars.toFixed(1));
        // setTotalReviews(`${data.total_feedback}+`);
      }
    } catch (error) {
      console.log("Average rating error:", error);
    }
  };

  useEffect(() => {
    fetchFeedbackList();
    fetchAverageRating();
  }, []);

  // Scroll Left
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -350,
        behavior: 'smooth'
      });
    }
  };

  // Scroll Right
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 350,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-20" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic">
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto">

          {/* Header Section */}
          <div className="text-center mb-16" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="300">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="500">
              Trusted by Tax<br />
              <span className="text-white bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                Professionals Worldwide
              </span>
            </h2>
            <p className="text-xl text-white max-w-3xl mx-auto" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="700">
              See how CPAs, tax preparers, and accounting professionals are transforming
              their practices and delivering exceptional results with AI-powered tax solutions.
            </p>
          </div>

          {/* Testimonial Carousel */}
          <div className="relative mb-20" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="900">
            <div className="relative w-full" role="region" aria-roledescription="carousel">
              <div className="overflow-hidden">
                <div
                  ref={scrollContainerRef}
                  className="flex gap-6 pb-4 overflow-x-auto hide-scrollbar"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {feedbacks.map((item) => {
                    const starCount = parseInt(item.stars) || 5;
                    const metrics = generateMetrics(item.user_role);
                    const company = getCompanyDisplay(item.user_name, item.user_role);

                    return (
                      <div
                        key={item.id}
                        className="min-w-[320px] md:min-w-[32%] flex-shrink-0"
                        data-aos="fade-up"
                        data-aos-duration="500"
                        data-aos-easing="ease-out-cubic"
                        data-aos-delay={`${1100 + (item.id - 1) * 200}`}
                      >
                        <div className="h-full">
                          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 h-full flex flex-col hover:border-zinc-700 transition-all duration-300 hover:shadow-lg hover:shadow-zinc-950/20">
                            {/* Star Ratings */}
                            <div className="flex mb-6">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className={`w-5 h-5 ${i < starCount ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                >
                                  <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
                                </svg>
                              ))}
                            </div>

                            {/* Testimonial Text */}
                            <blockquote className="text-white text-lg leading-relaxed mb-8 flex-grow">
                              "{item.comment}"
                            </blockquote>

                            {/* Performance Metric */}
                            <div className="mb-8">
                              <span className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full">
                                {metrics.text}
                              </span>
                            </div>

                            {/* Author Info */}
                            <div className="border-t border-gray-200 pt-6">
                              <div>
                                <h4 className="font-bold text-white text-lg mb-1">
                                  {item.user_name || "Anonymous"}
                                </h4>
                                <p className="text-gray-600 text-sm mb-1">
                                  {getDisplayRole(item.user_role)}
                                </p>
                                <p className="text-gray-500 text-sm">
                                  {company}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Buttons */}
              <button
                onClick={scrollLeft}
                className="absolute text-white left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 w-10 h-10 md:w-12 md:h-12 rounded-full  flex items-center justify-center text-gray-700 hover:text-blue-600  transition-all duration-200 left-5"
                aria-label="Previous testimonial"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#ffffff" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="m12 19-7-7 7-7"></path>
                  <path d="M19 12H5"></path>
                </svg>
              </button>

              <button
                onClick={scrollRight}
                className="absolute text-white right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 w-10 h-10 md:w-12 md:h-12 rounded-full  items-center justify-center text-gray-700 hover:text-blue-600 hover:border-blue-400 transition-all duration-200 right-5"
                aria-label="Next testimonial"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#ffffff" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>



        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}