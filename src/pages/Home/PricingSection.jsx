import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PricingSection() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [plans, setPlans] = useState([]);

  const fetchPlans = async () => {
    try {
      const res = await fetch(
        "http://168.231.121.7/seqwens/api/user/subscriptions/plans/public/"
      );
      const data = await res.json();
      if (data.success && data.data) {
        // New structure: data.monthly_plans and data.yearly_plans
        if (data.data.monthly_plans && data.data.yearly_plans) {
          const plansData = billingCycle === 'monthly' 
            ? (data.data.monthly_plans || [])
            : (data.data.yearly_plans || []);
          // Filter only active plans
          const filteredPlans = plansData.filter(plan => plan.is_active !== false);
          setPlans(filteredPlans);
        } 
        // Fallback: old structure with flat array
        else if (Array.isArray(data.data)) {
          const filteredPlans = data.data.filter(plan => 
            plan.billing_cycle === billingCycle && plan.is_active !== false
          );
          setPlans(filteredPlans);
        }
      }
    } catch (err) {
      console.log("Error:", err);
    }
  };

  useEffect(() => {
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingCycle]);

  return (
    <section id="pricing" className="py-8 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-4 md:px-6">
      <div className="max-w-9xl mx-auto bg-[#FFF4E6] rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-14 lg:p-20 relative overflow-visible">

        {/* Heading */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <p className="text-gray-500 text-xs sm:text-sm mb-2 sm:mb-3">Pricing</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#3B4A66] leading-tight px-2">
            SIMPLE, TRANSPARENT <span className="text-[#FF9D28]">PRICING</span>
          </h2>
          <p className="text-gray-600 mt-3 sm:mt-4 text-sm sm:text-base px-2">
            Choose the perfect plan for your practice. All plans include a 14-day free trial.
          </p>


          {/* Billing Toggle */}
          {/* Billing Toggle */}
          <div className="flex justify-center mb-10">
            <div className="flex bg-white border !rounded-lg shadow-md p-1 gap-1">
              {/* Monthly Button */}
              <button
                className={`px-6 py-2 !rounded-lg text-sm font-medium transition-colors duration-200 ${billingCycle === "monthly"
                  ? "bg-orange-500 text-white"
                  : "text-gray-700"
                  }`}
                onClick={() => setBillingCycle("monthly")}
              >
                Monthly
              </button>

              {/* Yearly Button */}
              <button
                className={`px-6 py-2 !rounded-lg text-sm font-medium transition-colors duration-200 ${billingCycle === "yearly"
                  ? "bg-orange-500 text-white"
                  : "text-gray-700"
                  }`}
                onClick={() => setBillingCycle("yearly")}
              >
                Yearly <span className="text-xs text-gray-500">(Save 17%)</span>
              </button>
            </div>
          </div>

        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch">
          {plans.map((plan, index) => {
            // Colors According to image design
            let cardBg = "bg-white";
            let cardText = "text-[#1F2A55]";
            let buttonBg = "bg-[#FCEEDC]";
            let buttonText = "text-black";
            let dividerColor = "bg-gray-200";

            if (index === 1) {
              // TEAM CARD (Turquoise / Teal)
              cardBg = "bg-[#00B8C7]";
              cardText = "text-white";
              buttonBg = "bg-white";
              buttonText = "text-[#00A3B3]";
              dividerColor = "bg-white/30";
            }

            if (index === 2) {
              // PROFESSIONAL CARD (Dark Blue)
              cardBg = "bg-[#2C3E50]";
              cardText = "text-white";
              buttonBg = "bg-white";
              buttonText = "text-[#2C3E50]";
              dividerColor = "bg-white/30";
            }

            if (index === 0) {
              // SOLO CARD (white + orange price)
              cardBg = "bg-white";
              cardText = "text-[#1F2A55]";
              dividerColor = "bg-gray-200";
            }

            if (index === 3) {
              // ENTERPRISE CARD (white)
              cardBg = "bg-white";
              cardText = "text-[#1F2A55]";
              dividerColor = "bg-gray-200";
            }

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-md border flex flex-col h-full ${cardBg} transition duration-300 hover:-translate-y-1`}
              >
                {/* MOST POPULAR BADGE */}
                {plan.most_popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-[#1C4E80] text-xs px-3 py-1 rounded-full shadow font-medium whitespace-nowrap">
                    Most Popular
                  </span>
                )}

                {/* Title */}
                <h3 className={`text-lg sm:text-xl font-bold capitalize mb-1 ${cardText}`}>
                  {plan.subscription_type}
                </h3>

                <p className={`text-xs sm:text-sm mb-4 opacity-80 ${cardText}`}>
                  {plan.description || ""}
                </p>

                {/* Price */}
                <div className="mb-2 flex items-baseline flex-wrap">
                  <span
                    className={`text-2xl sm:text-3xl md:text-3xl font-extrabold ${index === 0 ? "text-[#FF8A00]" : index === 3 ? "text-[#2C3E50]" : cardText
                      }`}
                  >
                    {plan.price_display || (billingCycle === "yearly" 
                      ? `$${parseFloat(plan.yearly_price || plan.price || 0).toFixed(2)}/year`
                      : `$${parseFloat(plan.monthly_price || plan.price || 0).toFixed(2)}/month`)}
                  </span>
                </div>
                {billingCycle === "yearly" && plan.monthly_equivalent && (
                  <p className={`text-xs opacity-80 mb-2 ${cardText}`}>
                    ${parseFloat(plan.monthly_equivalent).toFixed(2)}/month
                  </p>
                )}
                {billingCycle === "monthly" && plan.yearly_equivalent && (
                  <p className={`text-xs opacity-80 mb-2 ${cardText}`}>
                    ${parseFloat(plan.yearly_equivalent).toFixed(2)}/year
                  </p>
                )}

                {/* Discount for yearly */}
                {billingCycle === "yearly" && plan.discount_percentage && plan.discount_percentage > 0 && (
                  <p className="text-green-600 font-semibold text-xs sm:text-sm mb-4">
                    Save {plan.discount_percentage}%
                  </p>
                )}

                {/* Divider Line - visible in all cards */}
                <div className={`w-full h-[2px] ${dividerColor} my-4 sm:my-6`}></div>

                {/* Features */}
                <div className={`space-y-2 text-xs sm:text-sm flex-grow ${cardText}`}>
                  <div className="flex items-center gap-2 flex-nowrap">
                    <svg className="flex-shrink-0" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke={index === 0 || index === 3 ? "#22C55E" : "white"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="whitespace-nowrap">Additional Storage: <b>{plan.additional_storage_addon ? "Yes" : "No"}</b></span>
                  </div>
                  <div className="flex items-center gap-2 flex-nowrap">
                    <svg className="flex-shrink-0" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke={index === 0 || index === 3 ? "#22C55E" : "white"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="whitespace-nowrap">Additional User: <b>{plan.additional_user_addon ? "Yes" : "No"}</b></span>
                  </div>
                  <div className="flex items-center gap-2 flex-nowrap">
                    <svg className="flex-shrink-0" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.5 8.31039V9.00039C16.4991 10.6177 15.9754 12.1914 15.007 13.4868C14.0386 14.7821 12.6775 15.7297 11.1265 16.1883C9.57557 16.6469 7.91794 16.5918 6.40085 16.0313C4.88376 15.4708 3.58849 14.435 2.70822 13.0782C1.82795 11.7214 1.40984 10.1164 1.51626 8.50262C1.62267 6.88881 2.24791 5.35263 3.29871 4.12319C4.34951 2.89375 5.76959 2.03692 7.34714 1.6805C8.92469 1.32407 10.5752 1.48714 12.0525 2.14539M6.75 8.25039L9 10.5004L16.5 3.00039" stroke={index === 0 || index === 3 ? "#22C55E" : "white"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="whitespace-nowrap">Priority Support: <b>{plan.priority_support_addon ? "Yes" : "No"}</b></span>
                  </div>
                </div>

                {/* Button */}
                <button
                  onClick={() => navigate("/create-account")}
                  className={`mt-6 sm:mt-8 w-full py-2.5 sm:py-3 !rounded-xl font-semibold text-sm sm:text-base transition-colors
    ${cardBg === "bg-white" ? "bg-[#FF8A00] text-white hover:bg-[#E57A00]" : "bg-white text-black hover:bg-gray-50 mt-5"}
  `}
                >
                  {plan.most_popular ? "Start Free Trial" : "Choose Plan →"}
                </button>
              </div>
            );
          })}
        </div>
        {/* Bottom CTA */}
        <div className="mt-8 sm:mt-12 md:mt-16 bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 text-center max-w-3xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-bold text-[#3B4A66] mb-2 sm:mb-3 px-2">
            NEED A CUSTOM SOLUTION?
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm max-w-xl mx-auto mb-4 sm:mb-6 px-2">
            For large firms or franchise networks, we offer tailored solutions with dedicated hosting, white-labeling, and custom integrations.
          </p>
          <button 
            onClick={() => navigate("/create-account")}
            className="bg-[#F56D2D] text-white px-6 sm:px-8 py-2 sm:py-3 !rounded-lg font-semibold text-sm sm:text-base hover:bg-[#E55D1D] transition-colors"
          >
            Contact Our Sales Team
          </button>
        </div>
      </div>
    </section>
  );
}



