import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken, getStorage } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError, firmAdminSubscriptionAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

const API_BASE_URL = getApiBaseUrl();

const FinalizeSubscription = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [planDetails, setPlanDetails] = useState({}); // Store detailed plan info
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [processing, setProcessing] = useState(false);

  // Check if user is admin and has active subscription
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      const storage = getStorage();
      const userDataStr = storage?.getItem("userData");
      const userType = storage?.getItem("userType");

      // Check user type first
      if (userType !== 'admin' && userType !== 'firm') {
        navigate('/firmadmin', { replace: true });
        return;
      }

      if (!userDataStr) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const userData = JSON.parse(userDataStr);

        // Check billing status from userData in storage
        const billingStatus = userData.billing_status;
        const hasActiveSub = userData.subscription_plan &&
          !['expired', 'pending_payment', 'inactive', 'suspended'].includes(billingStatus);

        if (hasActiveSub) {
          navigate('/firmadmin', { replace: true });
          return;
        }

        // Also check subscription status from API to be sure
        const token = getAccessToken();
        if (token) {
          try {
            // Fetch subscription status from maintenance-mode/status endpoint
            const statusResponse = await fetchWithCors(`${API_BASE_URL}/user/maintenance-mode/status/`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
            });

            if (statusResponse.ok) {
              const statusResult = await statusResponse.json();

              // Check if subscription is active - use has_active_subscription or status === 'active'
              const isSubActive = statusResult.subscription && (
                statusResult.subscription.has_active_subscription === true ||
                statusResult.subscription.status === 'active'
              );

              if (statusResult.success && isSubActive) {
                // Update userData with subscription info
                userData.subscription_plan = statusResult.subscription.plan_name ||
                  statusResult.subscription.plan_type ||
                  userData.subscription_plan ||
                  'active';
                userData.billing_status = statusResult.subscription.status || 'active';
                userData.firm_status = statusResult.firm_status || 'active';

                storage.setItem("userData", JSON.stringify(userData));
                // Sync with sessionStorage too
                sessionStorage.setItem("userData", JSON.stringify(userData));

                console.log('Active subscription found, redirecting to firmadmin');
                toast.success('Your subscription is active. Welcome back!');

                // Redirect to firm admin dashboard
                navigate('/firmadmin', { replace: true });
                return;
              }
            }
          } catch (apiError) {
            console.error('Error checking subscription status from API:', apiError);
            // Continue with the page if API check fails - let user select plan
          }
        }
      } catch (error) {
        console.error('Error checking user data:', error);
        navigate('/login', { replace: true });
      }
    };

    checkSubscriptionStatus();
  }, [navigate]);

  // Fetch subscription plans
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = getAccessToken();

      // Try public endpoint first
      const publicUrl = `${API_BASE_URL}/user/subscriptions/plans/public/`;
      let response = await fetchWithCors(publicUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // If public endpoint fails, try authenticated endpoint
      if (!response.ok) {
        const authenticatedUrl = `${API_BASE_URL}/user/subscription-plans/`;
        response = await fetchWithCors(authenticatedUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Handle new response structure with monthly_plans and yearly_plans
      let plansData = [];
      if (result.success && result.data) {
        // New structure: data.monthly_plans and data.yearly_plans
        if (result.data.monthly_plans && result.data.yearly_plans) {
          // Use current billingCycle state value
          plansData = billingCycle === 'monthly'
            ? (result.data.monthly_plans || [])
            : (result.data.yearly_plans || []);
        }
        // Fallback: old structure with flat array
        else if (Array.isArray(result.data)) {
          plansData = result.data.filter(plan =>
            plan.billing_cycle === billingCycle
          );
        } else if (result.data.plans && Array.isArray(result.data.plans)) {
          // Nested plans structure (old format)
          plansData = result.data.plans.filter(plan =>
            plan.billing_cycle === billingCycle
          );
        }
      } else if (Array.isArray(result)) {
        // Direct array response (old format)
        plansData = result.filter(plan =>
          plan.billing_cycle === billingCycle
        );
      }

      // Extract user_billing_cycle from response if available (only if not already set)
      if (result.user_billing_cycle && !billingCycle) {
        setBillingCycle(result.user_billing_cycle);
        // Refetch with correct billing cycle
        if (result.data && result.data.monthly_plans && result.data.yearly_plans) {
          plansData = result.user_billing_cycle === 'monthly'
            ? (result.data.monthly_plans || [])
            : (result.data.yearly_plans || []);
        }
      }

      // For public endpoint, show all plans regardless of is_active status
      // The public endpoint already returns the appropriate plans
      setPlans(plansData);

      // Fetch detailed plan information for each plan (non-blocking)
      if (plansData.length > 0 && token) {
        // Fetch details in background without blocking UI
        Promise.all(plansData.map(async (plan) => {
          try {
            const detailUrl = `${API_BASE_URL}/user/subscription-plans/${plan.subscription_type}/`;
            const detailResponse = await fetchWithCors(detailUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
            });

            if (detailResponse.ok) {
              const detailResult = await detailResponse.json();
              if (detailResult.success && detailResult.data) {
                return { planId: plan.id, details: detailResult.data };
              }
            }
          } catch (err) {
            console.error(`Error fetching details for plan ${plan.id}:`, err);
          }
          return { planId: plan.id, details: null };
        })).then((detailsResults) => {
          const detailsMap = {};
          detailsResults.forEach(({ planId, details }) => {
            if (details) {
              detailsMap[planId] = details;
            }
          });
          setPlanDetails(detailsMap);
        });
      }

    } catch (err) {
      console.error('Error fetching subscription plans:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to load subscription plans. Please try again.');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [billingCycle]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans, billingCycle]);

  // Handle subscription cancelled redirect
  useEffect(() => {
    const subscriptionCancelled = searchParams.get('subscription_cancelled');
    if (subscriptionCancelled === 'true') {
      toast.info('Subscription setup was cancelled. Please select a plan to continue.', {
        position: 'top-right',
        autoClose: 5000,
      });
      // Remove parameter from URL
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Format plan type name
  const formatPlanType = (type) => {
    if (!type) return 'Plan';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get plan description
  const getPlanDescription = (type) => {
    const descriptions = {
      starter: 'Perfect for individual tax preparers',
      growth: 'Ideal for small firms',
      pro: 'Best for growing teams',
      elite: 'Complete solution for large organizations'
    };
    return descriptions[type?.toLowerCase()] || 'Subscription plan';
  };

  // Get plan features
  const getPlanFeatures = (plan) => {
    const details = planDetails[plan.id];
    const features = [];

    // Add features from plan details if available
    if (details) {
      if (details.max_users) {
        features.push(`Up to ${details.max_users} ${details.max_users === 1 ? 'User' : 'Users'}`);
      }
      if (details.max_clients) {
        features.push(`Up to ${details.max_clients} Client Accounts`);
      }
      if (details.storage_gb) {
        features.push(`${details.storage_gb} GB Storage`);
      }
      if (details.e_signatures_per_month) {
        features.push(`${details.e_signatures_per_month} E-Signature Requests/month`);
      }
      if (details.included_offices !== undefined && details.included_offices !== null) {
        const offices = details.included_offices;
        features.push(`${offices} ${offices === 1 ? 'Office Location' : 'Office Locations'} Included`);
      }
      if (details.additional_storage_addon) {
        features.push('Additional Storage Add-on Available');
      }
      if (details.additional_user_addon) {
        features.push('Additional User Add-on Available');
      }
      if (details.priority_support_addon) {
        features.push('Priority Support');
      }
    } else {
      // Also check plan object directly for included_offices
      if (plan.included_offices !== undefined && plan.included_offices !== null) {
        const offices = plan.included_offices;
        features.push(`${offices} ${offices === 1 ? 'Office Location' : 'Office Locations'} Included`);
      }
      // Default features based on plan type
      const defaultFeatures = {
        starter: [
          'Up to 1 User',
          '150 Client Accounts',
          '10 GB Storage',
          '15 E-Signature Requests/month',
          '1 Office Location Included',
          'Email Support'
        ],
        growth: [
          'Up to 10 Users',
          '500 Client Accounts',
          '50 GB Storage',
          '100 E-Signature Requests/month',
          '1 Office Location Included',
          'Priority Email Support'
        ],
        pro: [
          'Up to 25 Users',
          '1000 Client Accounts',
          '100 GB Storage',
          '250 E-Signature Requests/month',
          '3 Office Locations Included',
          'Priority Support',
          'Advanced Analytics'
        ],
        elite: [
          'Unlimited Users',
          'Unlimited Client Accounts',
          '500 GB Storage',
          '1000 E-Signature Requests/month',
          '5 Office Locations Included',
          '24/7 Priority Support',
          'Advanced Analytics',
          'Custom Integrations',
          'Dedicated Account Manager'
        ]
      };
      return defaultFeatures[plan.subscription_type?.toLowerCase()] || [];
    }

    return features;
  };

  // Handle subscription selection
  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  // Handle finalize subscription
  const handleFinalizeSubscription = async () => {
    if (!selectedPlan) {
      toast.error('Please select a subscription plan', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    try {
      setProcessing(true);

      // Build success and cancel URLs with base path
      const baseUrl = window.location.origin;
      const basePath = '/seqwens-frontend'; // Base path from vite.config.js
      const successUrl = `${baseUrl}${basePath}/firmadmin?subscription_success=true`;
      const cancelUrl = `${baseUrl}${basePath}/firmadmin/finalize-subscription?subscription_cancelled=true`;

      // Call the change subscription API (this will create checkout session)
      const response = await firmAdminSubscriptionAPI.changeSubscription(
        selectedPlan.id,
        billingCycle, // "monthly" or "yearly"
        "stripe", // payment_method
        true, // change_immediately
        successUrl, // success_url
        cancelUrl // cancel_url
      );

      if (response.success) {
        // Check if checkout URL is provided (Stripe checkout flow)
        if (response.data?.checkout_url) {
          // Redirect to Stripe checkout
          window.location.href = response.data.checkout_url;
        } else {
          // If no checkout URL, subscription was created without payment
          // Update user data and redirect
          const storage = getStorage();
          const userDataStr = storage?.getItem("userData");

          if (userDataStr) {
            try {
              const userData = JSON.parse(userDataStr);
              // Update subscription plan from response or selected plan
              userData.subscription_plan = response.data?.new_plan?.subscription_type ||
                response.data?.subscription_plan ||
                selectedPlan.subscription_type;
              storage.setItem("userData", JSON.stringify(userData));

              // Also update in sessionStorage
              sessionStorage.setItem("userData", JSON.stringify(userData));
            } catch (error) {
              console.error('Error updating user data:', error);
            }
          }

          const planName = response.data?.new_plan?.subscription_type_display ||
            response.data?.new_plan?.subscription_type ||
            selectedPlan.subscription_type ||
            'selected plan';

          toast.success(response.message || `Subscription plan ${planName} selected successfully!`, {
            position: 'top-right',
            autoClose: 3000,
          });

          // Redirect to firm admin dashboard
          setTimeout(() => {
            navigate('/firmadmin', { replace: true });
            window.location.reload();
          }, 1000);
        }
      } else {
        throw new Error(response.message || 'Failed to finalize subscription');
      }
    } catch (err) {
      console.error('Error finalizing subscription:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to finalize subscription. Please try again.', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F7FF] flex items-center justify-center px-4">
        <div className="text-center w-full max-w-md">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-[#3AD6F2] mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600 font-[BasisGrotesquePro]">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FF] py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 font-[BasisGrotesquePro]">
            Finalize Your Subscription
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 font-[BasisGrotesquePro] max-w-2xl mx-auto px-2">
            Please select a subscription plan to continue using the platform
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 max-w-4xl mx-auto">
            <p className="text-xs sm:text-sm text-red-700 font-[BasisGrotesquePro]">{error}</p>
          </div>
        )}

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-6 sm:mb-8 lg:mb-10">
          <div className="bg-white rounded-lg p-1 border border-gray-200 inline-flex shadow-sm">
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{ borderRadius: '8px' }}
              className={`px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 rounded-md text-sm sm:text-base font-medium transition-all duration-200 font-[BasisGrotesquePro] min-w-[80px] sm:min-w-[100px] ${billingCycle === 'monthly'
                ? 'bg-[#3AD6F2] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              style={{ borderRadius: '8px' }}
              className={`px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 rounded-md text-sm sm:text-base font-medium transition-all duration-200 font-[BasisGrotesquePro] min-w-[80px] sm:min-w-[100px] ${billingCycle === 'yearly'
                ? 'bg-[#3AD6F2] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        {plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-6 sm:mb-8 lg:mb-10">
            {plans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              // Get price based on billing cycle - prices come as strings from API
              // Use price from API response (already filtered by billing_cycle)
              const price = parseFloat(plan.price || plan.monthly_price || plan.yearly_price || 0);
              const priceDisplay = plan.price_display || `$${price.toFixed(2)}/${billingCycle === 'monthly' ? 'month' : 'year'}`;

              // Get plan display name
              const planName = plan.subscription_type_display ||
                formatPlanType(plan.subscription_type) ||
                plan.name ||
                'Plan';

              // Get plan features
              const features = getPlanFeatures(plan);

              return (
                <div
                  key={plan.id}
                  onClick={() => handleSelectPlan(plan)}
                  className={`bg-white rounded-xl border-2 p-5 sm:p-6 lg:p-7 cursor-pointer transition-all duration-200 hover:shadow-xl active:scale-[0.98] relative flex flex-col h-full ${isSelected
                    ? 'border-[#3AD6F2] shadow-lg ring-4 ring-[#3AD6F2] ring-opacity-20'
                    : 'border-gray-200 hover:border-[#3AD6F2] hover:shadow-md'
                    } ${plan.most_popular ? 'ring-2 ring-orange-200 sm:ring-4 sm:ring-opacity-30' : ''}`}
                >
                  {plan.most_popular && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="bg-[#F56D2D] text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold font-[BasisGrotesquePro] whitespace-nowrap shadow-md">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-5 sm:mb-6">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 font-[BasisGrotesquePro]">
                      {planName}
                    </h3>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-4 sm:mb-5 font-[BasisGrotesquePro] min-h-[2.5rem] sm:min-h-[3rem] flex items-center justify-center">
                      {getPlanDescription(plan.subscription_type)}
                    </p>
                    <div className="mb-4 sm:mb-5">
                      <div className="flex items-baseline justify-center gap-1 sm:gap-2">
                        <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                          {priceDisplay.split('/')[0]}
                        </span>
                        <span className="text-base sm:text-lg lg:text-xl text-gray-600 font-[BasisGrotesquePro]">
                          /{priceDisplay.split('/')[1]}
                        </span>
                      </div>
                      {billingCycle === 'yearly' && plan.monthly_equivalent && (
                        <div className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro] mt-2">
                          ${parseFloat(plan.monthly_equivalent).toFixed(2)}/month billed annually
                        </div>
                      )}
                      {/* {billingCycle === 'monthly' && plan.yearly_equivalent && (
                        <div className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro] mt-2">
                          Save ${parseFloat(plan.yearly_equivalent).toFixed(2)}/year with annual billing
                        </div>
                      )} */}
                    </div>
                    {billingCycle === 'yearly' && plan.discount_percentage && plan.discount_percentage > 0 && (
                      <div className="mb-4">
                        <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-green-100 text-green-700 font-[BasisGrotesquePro] shadow-sm">
                          Save {plan.discount_percentage || plan.discount_percentage_yearly}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Plan Features */}
                  <div className="flex-1 mb-5 sm:mb-6">
                    <div className="border-t border-gray-200 pt-4 sm:pt-5">
                      <h4 className="text-sm sm:text-base font-semibold text-gray-700 mb-3 sm:mb-4 font-[BasisGrotesquePro]">
                        Features:
                      </h4>
                      <ul className="space-y-2.5 sm:space-y-3 text-left">
                        {features.length > 0 ? (
                          features.map((feature, index) => (
                            <li key={index} className="flex items-start text-xs sm:text-sm lg:text-base text-gray-600 font-[BasisGrotesquePro]">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#3AD6F2] mr-2 sm:mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="leading-relaxed">{feature}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">
                            Features loading...
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="mt-auto pt-4 sm:pt-5 border-t border-gray-200">
                      <span className="inline-flex items-center justify-center w-full px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold bg-[#3AD6F2] text-white font-[BasisGrotesquePro] shadow-sm">
                        ✓ Selected
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6 sm:p-8 lg:p-10 text-center max-w-2xl mx-auto">
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 font-[BasisGrotesquePro]">No subscription plans available</p>
          </div>
        )}

        {/* Finalize Button */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 px-4 sm:px-0">
          {selectedPlan && (
            <div className="text-center sm:text-left">
              <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro] mb-1">
                Selected Plan:
              </p>
              <p className="text-sm sm:text-base font-semibold text-gray-900 font-[BasisGrotesquePro]">
                {selectedPlan.subscription_type_display || formatPlanType(selectedPlan.subscription_type)}
              </p>
            </div>
          )}
          <button
            onClick={handleFinalizeSubscription}
            disabled={!selectedPlan || processing}
            style={{ borderRadius: '8px' }}
            className="w-full sm:w-auto px-8 sm:px-10 lg:px-12 py-3 sm:py-3.5 lg:py-4 bg-[#F56D2D] text-white rounded-lg text-base sm:text-lg lg:text-xl font-semibold hover:bg-orange-600 active:bg-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro] shadow-lg hover:shadow-xl disabled:shadow-none min-h-[48px] sm:min-h-[52px]"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Finalize Subscription'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalizeSubscription;

