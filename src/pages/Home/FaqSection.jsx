import { useState } from "react";

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      title: "What is this platform?",
      answer: "It is an all-in-one tax practice management system designed specifically for tax professionals. It helps firms manage client intake, documents, workflows, tasks, communication, and return progress from one centralized dashboard. Unlike generic CRMs or form tools, the platform is built around real tax workflows, compliance needs, and seasonal volume."
    },
    {
      title: "Is the software easy to use?",
      answer: "Yes. The system is designed for tax professionals, not IT teams. Most firms are fully operational within hours, not weeks. Workflows, forms, and automations can be set up using plain language, without coding or complex configuration."
    },
    {
      title: "Who is the platform built for?",
      answer: "The platform supports solo tax preparers, growing firms with multiple staff, multi-office operations, and service bureaus/high-volume firms. It scales as your firm grows, without requiring a platform change later."
    },
    {
      title: "Do my clients need technical knowledge to use it?",
      answer: "No. Clients access a simple, secure portal where they can upload documents, complete forms, e-sign, and track return status. No training or special software is required on their end."
    },
    {
      title: "What problems does this replace?",
      answer: "The platform replaces spreadsheets/manual tracking, email-based document collection, generic form builders, disconnected CRMs, and manual follow-ups. Everything stays connected from intake to filing."
    },
    {
      title: "Does it support secure document management?",
      answer: "Yes. All client documents are stored securely and are accessible only by authorized users. The system is designed to meet IRS data security expectations and industry best practices."
    },
    {
      title: "Can I automate client follow-ups and tasks?",
      answer: "Yes. You can automate emails, SMS messages, task creation, and workflow updates based on client actions or return status, such as missing documents or completed reviews."
    },
    {
      title: "Can I customize workflows for my firm?",
      answer: "Absolutely. Workflows can be customized by firm, office, role, or return type. You control how returns move through each stage and what actions occur at every step."
    },
    {
      title: "How much does the software cost?",
      answer: "Pricing is based on firm size and feature needs. Multiple plans are available, from solo preparers to enterprise-level firms. You can view current pricing on the Pricing page."
    },
    {
      title: "What payment methods do you accept?",
      answer: "We accept major credit and debit cards. All payments are processed securely through encrypted payment providers."
    },
    {
      title: "Is my payment information secure?",
      answer: "Yes. Payment data is never stored on our servers and is handled through PCI-compliant processors to ensure maximum security."
    },
    {
      title: "Do you offer refunds?",
      answer: "Refund eligibility depends on the plan and timing of the request. Full details are available in our Terms of Service."
    },
    {
      title: "How do I upgrade or change my plan?",
      answer: "You can upgrade, downgrade, or change plans directly from your account dashboard. Changes take effect immediately or at the next billing cycle, depending on the plan."
    },
    {
      title: "How do I cancel my subscription?",
      answer: "Subscriptions can be canceled at any time from the billing section of your account. You will continue to have access through the end of your billing period."
    },
    {
      title: "I can’t access my billing portal. What should I do?",
      answer: "If you’re unable to access your billing settings, contact support through your dashboard and a team member will assist you promptly."
    },
    {
      title: "How do I get support?",
      answer: "Subscribed members can submit support requests directly through the in-app support form. Our team responds quickly, especially during tax season. Higher-tier plans include priority support and onboarding assistance."
    }
  ];

  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <h6 className="text-center text-sm font-semibold text-gray-500 tracking-wide mb-2 uppercase">
          Help Center
        </h6>

        <h2 className="text-center text-3xl md:text-5xl font-bold text-[#1C4E80] mb-6">
          Frequently Asked <span className="text-[#F49C2D]">Questions</span>
        </h2>

        <p className="text-center text-gray-500 text-lg mb-12">
          Everything you need to know about our tax practice management platform.
        </p>

        <div className="space-y-4">
          {faqs.map((item, index) => (
            <div
              key={index}
              className="rounded-[10px] bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <button
                className="w-full flex items-center justify-between p-6 text-left"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >


                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${openIndex === index ? "bg-[#00C0C6] text-white rotate-45" : "bg-gray-100 text-gray-400"}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  }`}
              >
                <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <h3 className="text-xl font-bold text-white mb-2">Still Have Questions?</h3>
          <p className="text-gray-500 mb-6">If you need help deciding which plan is right for your firm or want to see the platform in action, our team is happy to help.</p>
          <button className="text-[#F49C2D] font-bold hover:underline">Reach out through the support form →</button>
        </div>
      </div>
    </section>
  );
}
