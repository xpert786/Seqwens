// import { useState, useRef } from 'react';
// import imgss1 from "../../assets/imgss1.png";
// import imgss2 from "../../assets/imgss2.png";
// import imgss3 from "../../assets/imgss3.png";

// export default function Testimonials() {
//   const scrollContainerRef = useRef(null);

//   const testimonials = [
//     {
//       id: 1,
//       rating: 5,
//       text: "SeQwens has transformed our practice. Client communication is seamless, and our workflow efficiency has increased by 300%. The AI features have saved us countless hours during tax season.",
//       author: "Sarah Johnson",
//       position: "CPA, Johnson & Associates",
//       avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=00C0C6&color=fff",
//       bgGradient: "from-cyan-100/30 via-cyan-50/20 to-transparent"
//     },
//     {
//       id: 2,
//       rating: 5,
//       text: "SeQwens has transformed our practice. Client communication is seamless, and our workflow efficiency has increased by 300%. The AI features have saved us countless hours during tax season.",
//       author: "Sarah Johnson",
//       position: "CPA, Johnson & Associates",
//       avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=00C0C6&color=fff",
//       bgGradient: "from-blue-100/30 via-blue-50/20 to-transparent"
//     },
//     {
//       id: 3,
//       rating: 5,
//       text: "SeQwens has transformed our practice. Client communication is seamless, and our workflow efficiency has increased by 300%. The AI features have saved us countless hours during tax season.",
//       author: "Sarah Johnson",
//       position: "CPA, Johnson & Associates",
//       avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=00C0C6&color=fff",
//       bgGradient: "from-orange-100/30 via-orange-50/20 to-transparent"
//     },

//     {
//       id: 4,
//       rating: 5,
//       text: "SeQwens has transformed our practice. Client communication is seamless, and our workflow efficiency has increased by 300%. The AI features have saved us countless hours during tax season.",
//       author: "Sarah Johnson",
//       position: "CPA, Johnson & Associates",
//       avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=00C0C6&color=fff",
//       bgGradient: "from-orange-100/30 via-orange-50/20 to-transparent"
//     },
//     {
//       id: 4,
//       rating: 5,
//       text: "SeQwens has transformed our practice. Client communication is seamless, and our workflow efficiency has increased by 300%. The AI features have saved us countless hours during tax season.",
//       author: "Sarah Johnson",
//       position: "CPA, Johnson & Associates",
//       avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=00C0C6&color=fff",
//       bgGradient: "from-orange-100/30 via-orange-50/20 to-transparent"
//     },
//     {
//       id: 4,
//       rating: 5,
//       text: "SeQwens has transformed our practice. Client communication is seamless, and our workflow efficiency has increased by 300%. The AI features have saved us countless hours during tax season.",
//       author: "Sarah Johnson",
//       position: "CPA, Johnson & Associates",
//       avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=00C0C6&color=fff",
//       bgGradient: "from-orange-100/30 via-orange-50/20 to-transparent"
//     },

//   ];

//   const ratings = [
//     {
//       score: "4.9",
//       source: "Reviews",
//       total: "250+ reviews",
//       stars: 5
//     },
//     {

//       source: "G",
//       total: "250+ reviews",
//       stars: 5,
//       logo: true
//     },
//     {

//       source: "Capterra",
//       total: "150+ reviews",
//       stars: 5,
//       logo: true
//     },
//     {

//       source: "Trustpilot",
//       total: "120+ reviews",
//       stars: 5,
//       logo: true
//     }
//   ];

//   const scrollLeft = () => {
//     if (scrollContainerRef.current) {
//       scrollContainerRef.current.scrollBy({
//         left: -400,
//         behavior: 'smooth'
//       });
//     }
//   };

//   const scrollRight = () => {
//     if (scrollContainerRef.current) {
//       scrollContainerRef.current.scrollBy({
//         left: 400,
//         behavior: 'smooth'
//       });
//     }
//   };

//   return (
//     <section className="py-16 px-4 overflow-hidden">

//       {/* Header */}
//       <div className="text-center mb-12">
//         <p className="text-sm text-gray-600 mb-2">Testimonials</p>
//         <h2 className="text-3xl md:text-4xl font-bold text-[#3B4A66] mb-3">
//           LOVED BY <span className="text-[#F49C2D]">TAX PROFESSIONALS</span>
//         </h2>
//         <p className="text-gray-600 text-sm">
//           See what our customers have to say about transforming their practices with SeQwens.
//         </p>
//       </div>

//       <div className="relative">

//         {/* BACKGROUND TWO FIXED COLOR CIRCLES */}
//         <div className="absolute inset-0 overflow-hidden pointer-events-none">

//           {/* Left Blue Circle */}
//           <div className="absolute w-[420px] h-[420px] rounded-full 
//                   bg-[#3AD6F2] 
//                   left-[10%] top-[50%] -translate-y-1/2
//                   opacity-80 blur-[90px]">
//           </div>

//           {/* Right Orange Circle */}
//           <div className="absolute w-[420px] h-[420px] rounded-full 
//                   bg-[#F49C2D] 
//                   right-[10%] top-[50%] -translate-y-1/2
//                   opacity-80 blur-[90px]">
//           </div>

//         </div>


//         {/* MAIN SECTION — gradient removed */}
//         <div className="!mt-10 py-5 relative z-10">

//           {/* Horizontal Scrolling Testimonial Cards */}
//           <div className="relative mb-16">

//             {/* Scrollable Container */}
//             <div
//               ref={scrollContainerRef}
//               className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-10"
//               style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
//             >
//               {testimonials.map((testimonial) => (
//                 <div
//                   key={testimonial.id}
//                   className="flex-shrink-0 w-[350px] min-w-[350px]"
//                 >
//                   {/* White Card */}
//                   <div className="bg-white !border border-gray-200 rounded-2xl p-6 relative z-10">

//                     {/* Stars */}
//                     <div className="flex gap-1 mb-4">
//                       {[...Array(testimonial.rating)].map((_, i) => (
//                         <svg
//                           key={i}
//                           className="w-5 h-5 text-[#FFB84D]"
//                           fill="currentColor"
//                           viewBox="0 0 20 20"
//                         >
//                           <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//                         </svg>
//                       ))}
//                     </div>

//                     {/* Testimonial Text */}
//                     <p className="text-[#3B4A66] text-sm leading-relaxed mb-6">
//                       {testimonial.text}
//                     </p>

//                     {/* Author Info */}
//                     <div className="flex items-center gap-3">
//                       <img
//                         src={testimonial.avatar}
//                         alt={testimonial.author}
//                         className="w-12 h-12 rounded-full"
//                       />
//                       <div>
//                         <h6 className="font-semibold text-[#3B4A66] text-sm mt-2">
//                           {testimonial.author}
//                         </h6>
//                         <p className="text-xs text-gray-600">{testimonial.position}</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Navigation Buttons */}
//             <div className="flex gap-3 justify-start pl-6">
//               <button
//                 onClick={scrollLeft}
//                 className="text-white flex items-center justify-center"
//               >
//                 <svg width="42" height="30" viewBox="0 0 42 30" fill="none" xmlns="http://www.w3.org/2000/svg">
//                   <rect width="42" height="30" rx="15" fill="#F56D2D" />
//                   <path d="M19 19L15 15M15 15L19 11M15 15H27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
//                 </svg>
//               </button>

//               <button
//                 onClick={scrollRight}
//                 className="text-white flex items-center justify-center"
//               >
//                 <svg width="42" height="30" viewBox="0 0 42 30" fill="none" xmlns="http://www.w3.org/2000/svg">
//                   <rect width="42" height="30" rx="15" transform="matrix(-1 0 0 1 42 0)" fill="#F56D2D" />
//                   <path d="M23 19L27 15M27 15L23 11M27 15H15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
//                 </svg>
//               </button>
//             </div>
//           </div>

//           {/* OUTER WHITE BOX */}
//           <div className="w-[97%] mx-auto rounded-2xl p-8 mt-10 border bg-white relative overflow-hidden">

//             <div className="absolute inset-0 rounded-2xl pointer-events-none bg-white"></div>

//             {/* Ratings */}
//             <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6">

//               {ratings.map((rating, index) => (
//                 <div key={index} className="text-center flex flex-col items-center">

//                   {/* ⭐ IMAGE FIRST */}
//                   {rating.source === "G" && (
//                     <img src={imgss1} className="h-6 object-contain mb-2" alt="G2" />
//                   )}
//                   {rating.source === "Capterra" && (
//                     <img src={imgss2} className="h-6 object-contain mb-2" alt="Capterra" />
//                   )}
//                   {rating.source === "Trustpilot" && (
//                     <img src={imgss3} className="h-6 object-contain mb-2" alt="Trustpilot" />
//                   )}

//                   {/* ⭐ STARS SECOND */}
//                   <div className="flex justify-center gap-1 mb-2">
//                     {[...Array(rating.stars)].map((_, i) => (
//                       <svg
//                         key={i}
//                         className="w-5 h-5 text-[#FFB84D]"
//                         fill="currentColor"
//                         viewBox="0 0 20 20"
//                       >
//                         <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//                       </svg>
//                     ))}
//                   </div>

//                   {/* ⭐ SCORE LAST */}
//                   <div className="text-4xl font-bold text-[#3B4A66] mb-1">
//                     {rating.score}
//                   </div>

//                   <p className="text-sm text-gray-600">
//                     {rating.score} from {rating.total}
//                   </p>

//                 </div>

//               ))}
//             </div>
//           </div>

//         </div>

//       </div>



//     </section>
//   );
// }






import { useState, useRef, useEffect } from "react";
import imgss1 from "../../assets/imgss1.png";
import imgss2 from "../../assets/imgss2.png";
import imgss3 from "../../assets/imgss3.png";
import { getApiBaseUrl } from "../../ClientOnboarding/utils/corsConfig";

// Map technical role names to user-friendly display names
const getDisplayRole = (role) => {
  const roleMap = {
    'tax_preparer': 'Tax Preparer',
    'staff': 'Tax Preparer',
    'firm': 'Firm Admin',
    'firm_admin': 'Firm Admin',
    'client': 'Taxpayer',
    'taxpayer': 'Taxpayer',
    'super_admin': 'Administrator',
    'superadmin': 'Administrator',
  };
  
  if (!role) return '';
  
  // Convert to lowercase for case-insensitive matching
  const lowerRole = role.toLowerCase();
  
  // Check if it's already a display-friendly name (contains space or is capitalized)
  if (role.includes(' ') || (role[0] === role[0].toUpperCase() && !role.includes('_'))) {
    return role;
  }
  
  // Return mapped role or capitalize the original if no mapping exists
  return roleMap[lowerRole] || role.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

export default function Testimonials() {
  const scrollContainerRef = useRef(null);

  const [feedbacks, setFeedbacks] = useState([]);
  const [average, setAverage] = useState({
    average_stars: 0,
    total_feedback: 0,
  });

  // Fetch Feedback List
  const fetchFeedbackList = async () => {
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/user/feedback/list/`
      );
      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.feedback);
      }
    } catch (error) {
      console.log("Feedback list error:", error);
    }
  };

  // Fetch Average Ratings
  const fetchAverageRating = async () => {
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/user/feedback/average/`
      );
      const data = await res.json();
      if (data.success) {
        setAverage({
          average_stars: data.average_stars,
          total_feedback: data.total_feedback,
        });
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
        left: -400,
        behavior: "smooth",
      });
    }
  };

  // Scroll Right
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 400,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-16 px-4 overflow-hidden">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-sm text-gray-600 mb-2">Testimonials</p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#3B4A66] mb-3">
          LOVED BY <span className="text-[#F49C2D]">TAX PROFESSIONALS</span>
        </h2>
        <p className="text-gray-600 text-sm">
          See what our customers have to say about transforming their practices
          with SeQwens.
        </p>
      </div>

      <div className="relative">
        {/* BG Circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[420px] h-[420px] rounded-full 
                  bg-[#3AD6F2] 
                  left-[10%] top-[50%] -translate-y-1/2
                  opacity-80 blur-[90px]"></div>

          <div className="absolute w-[420px] h-[420px] rounded-full 
                  bg-[#F49C2D] 
                  right-[10%] top-[50%] -translate-y-1/2
                  opacity-80 blur-[90px]"></div>
        </div>

        <div className="!mt-10 py-5 relative z-10">
          {/* Scrollable Cards */}
          <div className="relative mb-16">
            <div
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto scroll-smooth pb-10 hide-scrollbar"
            >
              {feedbacks.map((item) => {
                const starCount = parseInt(item.stars) || 0;
                return (
                <div key={item.id} className="flex-shrink-0 w-[350px] min-w-[350px]">
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    {/* Stars */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(starCount)].map((_, i) => (
                        <svg
                          key={i}
                          className="w-5 h-5 text-[#FFB84D]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    {/* Comment */}
                    <p className="text-[#3B4A66] text-sm leading-relaxed mb-6">
                      {item.comment}
                    </p>

                    {/* User Info */}
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          item.profile_picture
                            ? item.profile_picture
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user_name || 'User')}&background=00C0C6&color=fff`
                        }
                        alt={item.user_name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h6 className="font-semibold text-[#3B4A66] text-sm">
                          {item.user_name}
                        </h6>
                        <p className="text-xs text-gray-600">{getDisplayRole(item.user_role)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>

            {/* Scroll Buttons */}
            <div className="flex gap-3 justify-start pl-6">
              <button onClick={scrollLeft}>
                <svg width="42" height="30" viewBox="0 0 42 30" fill="none">
                  <rect width="42" height="30" rx="15" fill="#F56D2D" />
                  <path d="M19 19L15 15M15 15L19 11M15 15H27" stroke="white" strokeWidth="1.5" />
                </svg>
              </button>

              <button onClick={scrollRight}>
                <svg width="42" height="30" viewBox="0 0 42 30" fill="none">
                  <rect width="42" height="30" rx="15" transform="matrix(-1 0 0 1 42 0)" fill="#F56D2D" />
                  <path d="M23 19L27 15M27 15L23 11M27 15H15" stroke="white" strokeWidth="1.5" />
                </svg>
              </button>
            </div>
          </div>

          {/* Average Rating Box */}
          <div className="w-[97%] mx-auto rounded-2xl p-8 mt-10 border bg-white">
            {(() => {
              const avgStars = Math.round(parseFloat(average.average_stars) || 0);
              const starDisplay = Math.max(0, Math.min(5, avgStars)); // Clamp between 0 and 5
              return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Score */}
              <div className="text-center flex flex-col items-center">
                <div className="text-4xl font-bold text-[#3B4A66] mb-1">
                  {average.average_stars}
                </div>
                <p className="text-sm text-gray-600">
                  {average.average_stars} from {average.total_feedback}+ reviews
                </p>
              </div>

              {/* G Logo */}
              <div className="text-center flex flex-col items-center">
                <img src={imgss1} className="h-6 mb-2" />
                <div className="flex gap-1 mb-2">
                  {[...Array(starDisplay)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-[#FFB84D]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>

              {/* Capterra */}
              <div className="text-center flex flex-col items-center">
                <img src={imgss2} className="h-6 mb-2" />
                <div className="flex gap-1 mb-2">
                  {[...Array(starDisplay)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-[#FFB84D]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>

              {/* Trustpilot */}
              <div className="text-center flex flex-col items-center">
                <img src={imgss3} className="h-6 mb-2" />
                <div className="flex gap-1 mb-2">
                  {[...Array(starDisplay)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-[#FFB84D]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>

            </div>
              );
            })()}
          </div>
        </div>
      </div>
    </section>
  );
}

