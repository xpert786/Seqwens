import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionAPI, taxpayerPublicAPI } from '../../ClientOnboarding/utils/apiUtils';
import { isLoggedIn, getUserData, getStorage } from '../../ClientOnboarding/utils/userUtils';
import ReachOutModal from '../../components/ReachOutModal';

export default function AiAutomation() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [plans, setPlans] = useState({ monthly: [], yearly: [] });
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(() => isLoggedIn());
  const [userData, setUserData] = useState(() => (isLoggedIn() ? getUserData() : null));
  const [isReachOutOpen, setIsReachOutOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const loggedIn = isLoggedIn();
      setIsUserLoggedIn(loggedIn);
      if (loggedIn) {
        setUserData(getUserData());
      } else {
        setUserData(null);
      }
    };
    checkAuth();
    const interval = setInterval(checkAuth, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleDashboardClick = () => {
    if (!isUserLoggedIn || !userData) {
      navigate("/login");
      return;
    }

    const storage = getStorage();
    const userType = storage?.getItem("userType") || userData?.user_type;

    if (userType === 'super_admin' || userType === 'support_admin' || userType === 'billing_admin') {
      navigate("/superadmin");
    } else if (userType === 'admin' || userType === 'firm') {
      navigate("/firmadmin");
    } else if (userType === 'tax_preparer') {
      navigate("/taxdashboard");
    } else {
      const isCompleted = userData.is_completed;
      if (isCompleted) {
        navigate("/dashboard");
      } else {
        navigate("/dashboard-first");
      }
    }
  };

  const getUserInitials = () => {
    if (!userData) return "U";
    const firstName = userData.first_name || userData.name || "";
    const lastName = userData.last_name || "";
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    return "U";
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await subscriptionAPI.getPublicPlans();
        if (response.success) {
          setPlans({
            monthly: response.data.monthly_plans || [],
            yearly: response.data.yearly_plans || [],
            stats: response.data.stats || { total_firms: 0, total_users: 0 }
          });
        }
      } catch (error) {
        console.error("Failed to fetch plans:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchFaqs = async () => {
      try {
        const response = await taxpayerPublicAPI.getFAQs();
        // Handle various likely response formats
        let data = [];
        if (Array.isArray(response)) {
          data = response;
        } else if (response.results && Array.isArray(response.results)) {
          data = response.results;
        } else if (response.data && Array.isArray(response.data)) {
          data = response.data;
        } else if (response.success && response.data) { // Fallback for success: true, data: [...]
          data = response.data;
        }

        if (Array.isArray(data)) {
          setFaqs(data);
        }
      } catch (error) {
        console.error("Failed to fetch FAQs:", error);
      }
    };

    fetchPlans();
    fetchFaqs();
  }, []);

  const getPlanMeta = (type) => {
    switch (type) {
      case 'starter': return { title: 'Starter', desc: 'Built for solo preparers just getting started.' };
      case 'team': return { title: 'Team', desc: 'For growing firms that need structure and automation.' };
      case 'pro': return { title: 'Pro', desc: 'Designed for high-volume firms and multi-preparer teams.' };
      case 'elite': return { title: 'Elite', desc: 'For service bureaus and firms built to scale.' };
      default: return { title: type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Plan', desc: 'Professional tax software.' };
    }
  };

  const handleGetStarted = (planType) => {
    // Redirect to sign up page
    let url = '/create-account';
    if (planType) {
      url += `?plan=${planType}&billing=${billingCycle}`;
    }
    navigate(url);
  };

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  // Group FAQs by category (description field)
  const groupedFaqs = faqs.reduce((acc, faq) => {
    const category = faq.description || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(faq);
    return acc;
  }, {});

  // Order categories as requested
  const categoryOrder = ["Getting Started", "Features & Functionality", "Billing & Payments", "Account & Support"];
  // Filter to only existing categories, plus any others at the end
  const sortedCategories = [
    ...categoryOrder.filter(c => groupedFaqs[c]),
    ...Object.keys(groupedFaqs).filter(c => !categoryOrder.includes(c))
  ];

  const features = [
    {
      title: "Client Intake",
      desc: "Digitize onboarding with smart questionnaires and automated follow-ups.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: "Return Tracking",
      desc: "Track every return from intake to e-file and funding with clear status stages.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      title: "Team Management",
      desc: "Assign roles, permissions, and workloads across offices and preparers.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      title: "Automation Rules",
      desc: "Trigger notifications, tasks, and reminders automatically based on client behavior.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      title: "E-Signature & Compliance",
      desc: "Send, track, and store signed documents securely with audit-ready records.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      )
    },
    {
      title: "Custom Forms & Requests",
      desc: "Create tax-specific document and data requests without technical setup.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    }
  ];

  const examples = [
    "Send a reminder if documents aren’t uploaded in 3 days.",
    "Move return to review when preparer marks it complete.",
    "Notify client when e-file is accepted."
  ];

  const reviews = [
    {
      quote: "What used to take multiple tools now happens in one place. Our document collection alone is 3x faster, and clients finally understand what we need from them.",
      stat: "40% reduction in turnaround time"
    },
    {
      quote: "We replaced forms, CRM, and manual tracking with one system. The automation paid for itself in the first season.",
      stat: "50% fewer admin hours"
    },
    {
      quote: "Our firm finally feels organized. Everyone knows what to do next, and nothing falls through the cracks.",
      stat: "3x better workflow visibility"
    }
  ];

  return (
    <div className="bg-black text-white" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic">
      {/* Section 1: End-to-End Workflow */}
      <section className="py-24 relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay="200">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay="400">
              Unlock End-to-End <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">Tax Workflow Control</span>
            </h2>
            <p className="text-xl text-zinc-400 leading-relaxed" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay="600">
              Our AI-powered features give you complete control over your firm’s operations.
            </p>
          </div>

          <div className="grid grid-cols-1  md:grid-cols-2 lg:grid-cols-3 gap-8" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay="800">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-zinc-900/50  overflow-hidden group relative  operations-box  p-8 rounded-2xl hover:bg-zinc-900 transition-colors" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay={`${300 + idx * 100}`}>
                <div className="w-12 h-12   operations-box rounded-xl flex items-center justify-center bg-[#00000010] text-blue-400 mb-6 ">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-zinc-400">{feature.desc}</p>   
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-zinc-700 group-hover:w-full transition-all duration-700"></div>  
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Before & After + Natural Language */}
      <section className="py-24 bg-zinc-900/30 border-y border-zinc-800 relative z-10">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay="200">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay="400">From Chaos to Control</h2>
            <p className="text-lg text-zinc-400" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay="600">
              See how firms transform from spreadsheets, emails, and disconnected tools into a fully automated tax operation in days, not months.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="400">
            <div className="order-2 lg:order-1">
              <h3 className="text-3xl font-bold mb-6" data-aos="fade-up" data-aos-duration="5000" data-aos-easing="ease-out-cubic" data-aos-delay="300">
                Edit & Automate With <span className="text-blue-400">Natural Language</span>
              </h3>
              <p className="text-zinc-400 mb-8 text-lg" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay="1200">
                Describe what you want to happen, and let the system do the work. Perfect for firms that want power without complexity.
              </p>
              {/* Examples */}
              <div className="space-y-4" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="500">
                {examples.map((ex, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                    <div className="mt-1 w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                      <span className="text-sm font-mono">{i + 1}</span>
                    </div>
                    <p className="text-zinc-300">"{ex}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Representation (Terminal) */}
            <div className="order-1 lg:order-2 relative" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay="400">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-20"></div>
              <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div className="ml-4 text-xs text-zinc-500 font-mono">automation-copilot.exe</div>
                </div>
                <div className="space-y-4 font-mono text-sm">
                  <div className="text-zinc-500"># Just type what you need...</div>
                  {examples.map((example, i) => (
                    <div key={i} className="flex gap-3 text-zinc-300">
                      <span className="text-blue-400">$</span>
                      <span className="typing-effect">{example}</span>
                    </div>
                  ))}
                  <div className="flex gap-3">
                    <span className="text-blue-400">$</span>
                    <span className="w-2 h-5 bg-blue-400 animate-pulse"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Built for Real Tax Professionals */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-12 items-center justify-between mb-16" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay="200">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay="400">Built for Real Tax Professionals</h2>
              <p className="text-xl text-zinc-400" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay="600">
                From Solo Preparers to Service Bureaus. Whether you prepare 50 returns or manage thousands across multiple offices, the platform scales with your firm.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay="400">
              {["Multi-office friendly", "Role-based permissions", "Bank product-ready workflows", "IRS-compliant data handling"].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-zinc-300 bg-zinc-900/50 px-4 py-3 rounded-lg border border-zinc-800" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay={`${1000 + i * 100}`}>
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Testimonials */}
      <section className="py-24 bg-gradient-to-b from-zinc-900 to-black border-t border-zinc-800">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="200">Trusted by Tax Professionals Nationwide</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="400">
            {reviews.map((review, i) => (
              <div key={i} className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl relative" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay={`${300 + i * 100}`}>
                <div className="text-blue-500 mb-6">
                  <svg className="w-8 h-8 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21L14.017 18C14.017 16.0547 15.1924 14.6328 16.9414 14.2852V6H19.9824V14.2852C19.9824 17.5195 18.0664 21 14.017 21ZM5.01367 21L5.01367 18C5.01367 16.0547 6.18906 14.6328 7.93809 14.2852V6H10.9791V14.2852C10.9791 17.5195 9.06309 21 5.01367 21Z" />
                  </svg>
                </div>
                <p className="text-zinc-300 mb-6 leading-relaxed">"{review.quote}"</p>
                <div className="pt-6 border-t border-zinc-800">
                  <p className="font-bold text-green-400">{review.stat}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Pricing */}
      <section className="py-24 bg-zinc-900/20 relative border-t border-zinc-800">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-12" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="200">
            <h2 className="text-3xl md:text-5xl font-bold mb-6" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="400">Choose Your <span className="text-blue-400">Practice Management Plan</span></h2>
            <p className="text-lg text-zinc-400 mb-8" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out-cubic" data-aos-delay="400">Run your tax firm with confidence using powerful automation, secure client tools, and AI-driven workflows.</p>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="400">
              <span className={`text-sm font-semibold ${billingCycle === 'monthly' ? 'text-white' : 'text-zinc-500'}`}>Monthly</span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="w-14 h-8 bg-zinc-800 rounded-full p-1 relative transition-colors duration-200" style={{ borderRadius: '30px' }}
              >
                <div className={`w-6 h-6 bg-blue-500 rounded-full transition-all duration-200 transform ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
              <span className={`text-sm font-semibold ${billingCycle === 'yearly' ? 'text-white' : 'text-zinc-500'}`}>Yearly <span className="text-green-400 text-xs ml-1">Save up to 17%</span></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="400">
            {loading ? (
              <div className="col-span-full py-12 text-center" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="600">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                <p className="text-zinc-500">Loading plans...</p>
              </div>
            ) : (billingCycle === 'monthly' ? plans.monthly : plans.yearly).length > 0 ? (
              (billingCycle === 'monthly' ? plans.monthly : plans.yearly).map((plan, idx) => {
                const meta = getPlanMeta(plan.subscription_type);
                const isPopular = plan.most_popular;
                const isCurrent = plan.is_current;
                const price = parseFloat(plan.price);

                return (
                  <div key={plan.id} className={`bg-zinc-900 border ${isCurrent ? 'border-2 border-emerald-500 shadow-xl shadow-emerald-900/20 transform md:-translate-y-4 relative' : isPopular ? 'border-2 border-blue-500 shadow-xl shadow-blue-900/20 transform md:-translate-y-4 relative' : 'border-zinc-800 hover:border-zinc-700'} rounded-2xl p-6 flex flex-col transition-all`} data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay={`${500 + idx * 100}`}>
                    {isCurrent ? (
                      <div className="absolute top-0 right-0 left-0 bg-emerald-600 text-white text-xs font-bold text-center py-1 rounded-t-lg uppercase tracking-wider">Your Current Plan</div>
                    ) : isPopular ? (
                      <div className="absolute top-0 right-0 left-0 bg-blue-600 text-white text-xs font-bold text-center py-1 rounded-t-lg">Most Popular</div>
                    ) : null}
                    <h3 className={`text-xl font-bold text-white mb-2 ${isPopular || isCurrent ? 'mt-4' : ''}`}>{meta.title}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">${Number.isInteger(price) ? price : price.toFixed(2)}</span>
                      <span className="text-zinc-500 text-sm"> / {billingCycle === 'monthly' ? 'month' : 'year'}</span>
                      <div className="text-xs text-zinc-500 mt-1">Billed {billingCycle}</div>
                    </div>
                    <p className="text-sm text-zinc-400 mb-6">{meta.desc}</p>
                    <button
                      onClick={() => handleGetStarted(plan.subscription_type)}
                      disabled={isCurrent}
                      className={`w-full py-2 rounded-[10px] font-medium mb-6 transition-colors ${isCurrent
                        ? 'bg-zinc-800 text-zinc-500 cursor-default'
                        : isPopular
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                        }`}
                    >
                      {isCurrent ? 'Current Plan' : 'Get Started'}
                    </button>
                    <ul className="space-y-3 text-sm flex-1">
                      {(plan.features_list || []).map((feat, i) => (
                        <li key={i} className="flex gap-2 text-zinc-300">
                          <svg className={`w-4 h-4 shrink-0 mt-0.5 ${isCurrent ? 'text-emerald-400' : isPopular ? 'text-blue-400' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => {
                        setSelectedPlan(plan);
                        setIsPlanModalOpen(true);
                      }}
                      className="mt-4 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider"
                    >
                      View All Details
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-zinc-500" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="600">
                <p>No subscription plans currently available.</p>
              </div>
            )}
          </div>

          {/* Platform Stats / Active Subscriptions */}
          {plans.stats && (plans.stats.total_firms > 0 || plans.stats.total_users > 0) && (
            <div className="mt-16 pt-16 border-t border-zinc-800/50">
              <div className="flex flex-wrap justify-center gap-12 md:gap-24" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="200">
                <div className="text-center" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="400">
                  <div className="text-4xl font-bold text-white mb-1">
                    {plans.stats.total_firms < 10 ? `${plans.stats.total_firms}+` : plans.stats.total_firms.toLocaleString() + '+'}
                  </div>
                  <div className="text-zinc-500 uppercase tracking-widest text-xs font-bold">Active Firms</div>
                </div>
                <div className="text-center" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="600">
                  <div className="text-4xl font-bold text-white mb-1">
                    {plans.stats.total_users < 100 ? `${plans.stats.total_users}+` : plans.stats.total_users.toLocaleString() + '+'}
                  </div>
                  <div className="text-zinc-500 uppercase tracking-widest text-xs font-bold">Tax Professionals</div>
                </div>
                <div className="text-center" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="800">
                  <div className="text-4xl font-bold text-white mb-1">99.9%</div>
                  <div className="text-zinc-500 uppercase tracking-widest text-xs font-bold">Platform Uptime</div>
                </div>
              </div>
              <p className="text-center text-zinc-500 text-sm mt-8">
                Across the entire platform, firms are managing thousands of clients with SeQwens.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Section 6: Why Firms Switch & CTA */}
      <section className="py-24 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Why Switch Grid */}
            <div className="text-center mb-16" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="200">
              <h2 className="text-3xl md:text-4xl font-bold mb-12" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="400">Why Firms Switch to Us</h2>
              <p className="text-lg text-zinc-400 mb-8 max-w-2xl mx-auto" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="600">Unlike generic CRMs or form builders, this platform is built specifically for tax professionals.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="800">
                {[
                  {
                    title: "More Powerful",
                    desc: "Than basic form tools. Handle complex tax scenarios with ease."
                  },
                  {
                    title: "Faster Setup",
                    desc: "Than legacy tax CRMs. Get up and running in minutes, not weeks."
                  },
                  {
                    title: "Deeper Automation",
                    desc: "Than one-size-fits-all platforms. Intelligent workflows designed for tax."
                  },
                  {
                    title: "Connected Workflow",
                    desc: "From intake to e-file to funding, everything stays connected."
                  }
                ].map((item, i) => (
                  <div key={i} className="text-left p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/50 transition-colors" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay={`${500 + i * 100}`}>
                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-zinc-400 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Final CTA */}
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-3xl p-12 text-center relative overflow-hidden backdrop-blur-sm" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="200">
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="400">Ready to Modernize Your Tax Firm?</h2>
                <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="600">
                  Join thousands of tax professionals who’ve replaced spreadsheets, emails, and disconnected tools with one intelligent system.
                </p>

                <div className="flex flex-col items-center gap-6" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="800">
                  {isUserLoggedIn ? (
                    <button
                      onClick={handleDashboardClick}
                      className="flex flex-col items-center justify-center w-32 h-32 rounded-full bg-white text-black hover:bg-zinc-100 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300 transform hover:scale-110 group relative border-2 border-zinc-200"
                    >
                      <div className="absolute inset-0 rounded-full border-2 border-blue-500/0 group-hover:border-blue-500/50 transition-all duration-300 scale-110 opacity-0 group-hover:opacity-100"></div>
                      <span className="text-2xl font-bold text-blue-600 mb-1">{getUserInitials()}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-blue-500 transition-colors">Dashboard</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mt-1 translate-x-0 group-hover:translate-x-1 transition-transform">
                        <path d="M5 12h14"></path>
                        <path d="m12 5 7 7-7 7"></path>
                      </svg>
                    </button>
                  ) : (
                    <button onClick={() => handleGetStarted()} className="bg-blue-600 hover:bg-blue-500 text-white text-lg font-semibold px-8 py-4 rounded-[10px] transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25" style={{ borderRadius: '10px' }}>
                      Start Today and Take Control
                    </button>
                  )}

                  <div className="flex items-center gap-2 text-zinc-400 text-sm" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="1000">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay={`${500 + i * 50}`}>
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span>4.9/5 average rating from tax professionals</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: FAQ */}
      <section className="py-24 bg-zinc-900 border-t border-zinc-800">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="200">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="400">Frequently Asked Questions</h2>
            <p className="text-lg text-zinc-400" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="600">Everything you need to know about our tax practice management platform.</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-12">
            {sortedCategories.map((category, catIdx) => (
              <div key={catIdx}>

                <div className="space-y-4">
                  {groupedFaqs[category].map((faq) => (
                    <div key={faq.id || faq.title} className="border border-zinc-800 rounded-xl bg-zinc-950 overflow-hidden text-left">
                      <button
                        onClick={() => toggleFaq(faq.id || faq.title)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-zinc-900 transition-colors"
                      >
                        <span className="font-semibold text-lg pr-8">{faq.title}</span>
                        <svg
                          className={`w-6 h-6 text-zinc-500 transform transition-transform duration-200 ${openFaq === (faq.id || faq.title) ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === (faq.id || faq.title) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                      >
                        <div className="p-6 pt-0 text-zinc-400 leading-relaxed whitespace-pre-wrap">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-16 text-center bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="200">
              <h3 className="text-xl font-bold mb-4" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="400">Still Have Questions?</h3>
              <p className="text-zinc-400 mb-6" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="600">If you need help deciding which plan is right for your firm or want to see the platform in action, our team is happy to help.</p>
              <div className="inline-flex" data-aos="fade-up" data-aos-duration="500" data-aos-easing="ease-out-cubic" data-aos-delay="800">
                <button
                  onClick={() => setIsReachOutOpen(true)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-[10px] font-medium transition-colors"
                >
                  Reach out to Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ReachOutModal isOpen={isReachOutOpen} onClose={() => setIsReachOutOpen(false)} />

      {/* Plan Details Modal */}
      {isPlanModalOpen && selectedPlan && (() => {
        const meta = getPlanMeta(selectedPlan.subscription_type);
        return (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#121214] border border-zinc-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="relative p-8">
                <button
                  onClick={() => setIsPlanModalOpen(false)}
                  className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">{meta.title} Plan</h2>
                    {selectedPlan.is_current && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-1">
                        Active Subscription
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-3">Pricing Info</h3>
                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Monthly Price</span>
                          <span className="text-white font-bold">${parseFloat(selectedPlan.monthly_price).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Yearly Price</span>
                          <span className="text-white font-bold">${parseFloat(selectedPlan.yearly_price || (selectedPlan.monthly_price * 12)).toFixed(2)}</span>
                        </div>
                        {selectedPlan.discount_percentage > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-emerald-400">Annual Savings</span>
                            <span className="text-emerald-400 font-bold">{selectedPlan.discount_percentage}% OFF</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                          <span className="text-zinc-400 uppercase text-[10px] font-bold">Billing Cycle</span>
                          <span className="text-white font-bold capitalize">{selectedPlan.billing_cycle}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-3">Platform Limits</h3>
                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Included Offices</span>
                          <span className="text-white font-bold">{selectedPlan.included_offices}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Max Users</span>
                          <span className="text-white font-bold">{selectedPlan.max_users_display}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Max Clients</span>
                          <span className="text-white font-bold">{selectedPlan.max_clients_display}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Storage Limit</span>
                          <span className="text-white font-bold">{selectedPlan.storage_display}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">E-Signatures</span>
                          <span className="text-white font-bold">{selectedPlan.e_signatures_display} / mo</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Workflows</span>
                          <span className="text-white font-bold">{selectedPlan.max_workflows_display}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-3">Available Add-ons</h3>
                      <div className="grid grid-cols-1 gap-3">
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${selectedPlan.additional_storage_addon ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${selectedPlan.additional_storage_addon ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
                          <span className="text-sm font-medium">Extra Storage Support</span>
                          {selectedPlan.additional_storage_addon && <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${selectedPlan.additional_user_addon ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${selectedPlan.additional_user_addon ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
                          <span className="text-sm font-medium">Extra Admin Slots</span>
                          {selectedPlan.additional_user_addon && <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${selectedPlan.priority_support_addon ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${selectedPlan.priority_support_addon ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
                          <span className="text-sm font-medium">Priority Support</span>
                          {selectedPlan.priority_support_addon && <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${selectedPlan.custom_pricing === 'enabled' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${selectedPlan.custom_pricing === 'enabled' ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
                          <span className="text-sm font-medium">Custom Enterprise Pricing</span>
                          {selectedPlan.custom_pricing === 'enabled' && <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsPlanModalOpen(false);
                        handleGetStarted(selectedPlan.subscription_type);
                      }}
                      disabled={selectedPlan.is_current}
                      className={`w-full py-4 rounded-2xl font-bold transition-all ${selectedPlan.is_current
                        ? 'bg-zinc-800 text-zinc-500 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/20'
                        }`}
                    >
                      {selectedPlan.is_current ? 'Currently Subscribed' : 'Upgrade to this Plan'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
