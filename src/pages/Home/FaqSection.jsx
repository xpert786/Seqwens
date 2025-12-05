import { useState } from "react";

export default function FaqSection() {
  const faqs = [
    {
      q: "HOW SECURE IS THE SEQWENS PLATFORM?",
      a: "SeQwens employs bank-level security with SOC2 and HIPAA compliance. We use AES-256 encryption for data at rest and SSL/TLS encryption for data in transit. All data is stored in secure AWS/GCP infrastructure with daily encrypted backups and comprehensive audit logs.",
    },
    {
      q: "CAN I CUSTOMIZE THE CLIENT PORTAL WITH MY FIRM'S BRANDING?",
      a: "Yes, you can fully customize the portal to match your firm’s branding including logo, theme colors, and more.",
    },
    {
      q: "HOW DOES THE E-SIGNATURE FEATURE WORK?",
      a: "Our platform provides legally compliant e-signatures that allow clients to securely review and sign documents online.",
    },
    {
      q: "WHAT INTEGRATIONS DOES SEQWENS OFFER?",
      a: "We support integrations with popular tax, accounting, and workflow tools to streamline your operations.",
    },
    {
      q: "CAN I MIGRATE MY EXISTING CLIENT DATA TO SEQWENS?",
      a: "Yes, our team will help you seamlessly migrate all your existing client data.",
    },
  ];

  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="py-20 px-6 bg-[#FFFFFF]">
      <h6 className="text-center text-sm font-semibold text-[#4B5563] tracking-wide">
        FAQ
      </h6>

      <h2 className="text-center text-4xl font-bold text-[#1C4E80]">
        FREQUENTLY ASKED <span className="text-[#F49C2D]">QUESTIONS</span>
      </h2>

      <p className="text-center text-[#3B4A66] mt-2">
        Get answers to the most common questions about SeQwens.
      </p>

      <div className="max-w-4xl mx-auto mt-10 space-y-4">

        {faqs.map((item, index) => (
          <div
            key={index}
            className="rounded-xl bg-[#FFF4E6] !border border-[#E8F0FF] p-3 cursor-pointer"
          >
            {/* HEADER (text + icon same line) */}
            <div
              className="flex items-center justify-between"
              onClick={() =>
                setOpenIndex(openIndex === index ? null : index)
              }
            >
              <p className="text-[#1C4E80] font-semibold text-sm">
                {item.q}
              </p>

              {/* PLUS / MINUS ICON */}
              <div className="w-6 h-6 flex items-center justify-center">
                {openIndex === index ? (
                  // MINUS
                  <svg width="22" height="22" viewBox="0 0 22 22">
                    <circle cx="11" cy="11" r="10" stroke="#00C0C6" strokeWidth="2" fill="none" />
                    <path d="M6 11H16" stroke="#00C0C6" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  // PLUS
                  <svg width="22" height="22" viewBox="0 0 22 22">
                    <circle cx="11" cy="11" r="10" stroke="#00C0C6" strokeWidth="2" fill="none" />
                    <path d="M11 6V16M6 11H16" stroke="#00C0C6" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </div>
            </div>

            {/* ANSWER */}
            {openIndex === index && (
              <p className="mt-3 text-sm text-gray-700">
                {item.a}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
