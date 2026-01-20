import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PricingSection() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState("monthly");

  const plans = [
    {
      id: "starter",
      name: "Starter",
      description: "Built for solo preparers just getting started.",
      monthlyPrice: 29,
      yearlyPrice: 29 * 12 * 0.83, // Approx 17% off
      activeClients: "Up to 150 active clients",
      features: [
        "Secure client portal",
        "Smart client intake forms",
        "Document upload & storage",
        "E-signature requests",
        "Basic workflow tracking",
        "Email notifications",
        "Standard reporting",
        "IRS-compliant data security",
        "Standard support"
      ],
      mostPopular: false
    },
    {
      id: "growth",
      name: "Growth",
      description: "For growing firms that need structure and automation.",
      monthlyPrice: 59,
      yearlyPrice: 59 * 12 * 0.83,
      activeClients: "Up to 500 active clients",
      features: [
        "Everything in Starter",
        "Advanced client intake logic",
        "Automated document requests & reminders",
        "Task assignments for preparers and admins",
        "Return status tracking",
        "SMS + email notifications",
        "Custom pipelines & workflows",
        "Priority support"
      ],
      mostPopular: false
    },
    {
      id: "pro",
      name: "Pro",
      description: "Designed for high-volume firms and multi-preparer teams.",
      monthlyPrice: 99,
      yearlyPrice: 99 * 12 * 0.83,
      activeClients: "Up to 2,000 active clients",
      features: [
        "Everything in Growth",
        "AI-assisted workflow automation",
        "Natural-language workflow rules",
        "Role-based permissions",
        "Multi-office support",
        "Internal notes & activity tracking",
        "Advanced analytics & performance reports",
        "Bank-product-ready workflows",
        "Priority onboarding & support",
        "Early feature access"
      ],
      mostPopular: true
    },
    {
      id: "elite",
      name: "Elite",
      description: "For service bureaus and firms built to scale.",
      monthlyPrice: 149,
      yearlyPrice: 149 * 12 * 0.83,
      activeClients: "Unlimited clients",
      features: [
        "Everything in Pro",
        "Unlimited workflows & automations",
        "AI-driven task routing",
        "Custom intake & document templates",
        "White-label client portal",
        "API & advanced integrations",
        "Dedicated account support",
        "Early access to new AI features",
        "Premium priority support"
      ],
      mostPopular: false
    }
  ];

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-9xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-16">
          <p className="text-white font-medium tracking-wide text-sm mb-4 uppercase">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Choose Your <span className="text-white">Practice Management Plan</span>
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Run your tax firm with confidence using powerful automation, secure client tools, and AI-driven workflows.
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center mt-10">
            <div className="bg-white p-1 rounded-xl shadow-sm border border-orange-100 flex items-center">
              <button
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${billingCycle === "monthly"
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
                onClick={() => setBillingCycle("monthly")}
              >
                Monthly
              </button>
              <button
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${billingCycle === "yearly"
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
                onClick={() => setBillingCycle("yearly")}
              >
                Yearly
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${billingCycle === "yearly" ? "bg-white/20 text-white" : "bg-green-100 text-green-700"
                  }`}>
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-8 rounded-3xl border transition-all duration-300 flex flex-col h-full group hover:-translate-y-2 ${plan.mostPopular
                ? "bg-[#1F2A55] text-white border-[#1F2A55] shadow-xl ring-4 ring-orange-500/20"
                : "bg-white text-[#1F2A55] border-gray-100 hover:border-orange-200 hover:shadow-xl"
                }`}
            >
              {plan.mostPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                  MOST POPULAR
                </div>
              )}

              <h3 className={`text-2xl font-bold mb-2 ${plan.mostPopular ? "text-white" : "text-[#1F2A55]"}`}>
                {plan.name}
              </h3>
              <p className={`text-sm mb-6 min-h-[40px] ${plan.mostPopular ? "text-gray-300" : "text-gray-500"}`}>
                {plan.description}
              </p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    ${billingCycle === "monthly" ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12)}
                  </span>
                  <span className={`text-sm font-medium ${plan.mostPopular ? "text-gray-300" : "text-gray-400"}`}>
                    / month
                  </span>
                </div>
                {billingCycle === "yearly" && (
                  <p className={`text-xs mt-2 ${plan.mostPopular ? "text-orange-300" : "text-green-600"}`}>
                    Billed ${Math.round(plan.yearlyPrice)} yearly
                  </p>
                )}
              </div>

              <div className={`w-full h-px mb-6 ${plan.mostPopular ? "bg-white/10" : "bg-gray-100"}`}></div>

              <div className="space-y-4 flex-grow mb-8">
                <div className={`flex items-center gap-3 font-semibold ${plan.mostPopular ? "text-white" : "text-[#1F2A55]"}`}>
                  <svg className={`w-5 h-5 flex-shrink-0 ${plan.mostPopular ? "text-orange-400" : "text-orange-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {plan.activeClients}
                </div>
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.mostPopular ? "text-orange-400" : "text-green-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={`text-sm ${plan.mostPopular ? "text-gray-300" : "text-gray-600"}`}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate("/create-account")}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${plan.mostPopular
                  ? "bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-orange-500/25"
                  : "bg-[#1F2A55] text-white hover:bg-[#2C3E50] hover:shadow-blue-900/25"
                  }`}
              >
                {plan.mostPopular ? "Get Started Now" : "Choose Plan"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
