import { useEffect, useState } from "react";
import { getApiBaseUrl } from "../../ClientOnboarding/utils/corsConfig";

export default function FaqSection() {
  const [faqs, setFaqs] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FETCH FAQ API
  const fetchFaqs = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/taxpayer/faqs/`);
      const data = await res.json();

      if (data.success) {
        setFaqs(data.data);
      } else {
        setError("Failed to load FAQs.");
      }
    } catch (err) {
      setError("Something went wrong while fetching FAQs.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  return (
    <section id="faq" className="py-10 sm:py-14 md:py-16 lg:py-20 px-3 sm:px-4 md:px-6 bg-[#FFFFFF]">
      <h6 className="text-center text-xs sm:text-sm font-semibold text-[#4B5563] tracking-wide">
        FAQ
      </h6>

      <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-[#1C4E80] px-2">
        FREQUENTLY ASKED <span className="text-[#F49C2D]">QUESTIONS</span>
      </h2>

      <p className="text-center text-[#3B4A66] text-sm sm:text-base mt-2 px-2">
        Get answers to the most common questions about SeQwens.
      </p>

      <div className="max-w-4xl mx-auto mt-6 sm:mt-8 md:mt-10 space-y-3 sm:space-y-4">

        {/* LOADING */}
        {loading && (
          <p className="text-center text-gray-500 text-sm">Loading FAQs...</p>
        )}

        {/* ERROR */}
        {error && (
          <p className="text-center text-red-500 text-sm">{error}</p>
        )}

        {/* FAQ LIST */}
        {!loading &&
          !error &&
          faqs.map((item, index) => (
            <div
              key={item.id}
              className="rounded-lg sm:rounded-xl bg-[#FFF4E6] !border border-[#E8F0FF] p-3 sm:p-4 md:p-5 cursor-pointer"
            >
              {/* HEADER */}
              <div
                className="flex items-start sm:items-center justify-between gap-2 sm:gap-3"
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
              >
                <p className="text-[#1C4E80] font-semibold text-xs sm:text-sm md:text-base flex-1 leading-tight sm:leading-normal">
                  {item.title}
                </p>

                {/* PLUS / MINUS ICON */}
                <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center flex-shrink-0">
                  {openIndex === index ? (
                    // MINUS
                    <svg className="w-5 h-5 sm:w-[22px] sm:h-[22px]" viewBox="0 0 22 22">
                      <circle cx="11" cy="11" r="10" stroke="#00C0C6" strokeWidth="2" fill="none" />
                      <path d="M6 11H16" stroke="#00C0C6" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    // PLUS
                    <svg className="w-5 h-5 sm:w-[22px] sm:h-[22px]" viewBox="0 0 22 22">
                      <circle cx="11" cy="11" r="10" stroke="#00C0C6" strokeWidth="2" fill="none" />
                      <path d="M11 6V16M6 11H16" stroke="#00C0C6" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
              </div>

              {/* ANSWER */}
              {openIndex === index && (
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-700 leading-relaxed">
                  {item.answer}
                </p>
              )}
            </div>
          ))}
      </div>
    </section>
  );
}
