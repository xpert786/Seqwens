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

  // Check if user is admin and has no subscription
  useEffect(() => {
    const storage = getStorage();
    const userDataStr = storage?.getItem("userData");
    
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        const userType = storage?.getItem("userType");
        
        // If user is not admin or has subscription, redirect
        if (userType !== 'admin' || userData.subscription_plan !== null) {
          navigate('/firmadmin', { replace: true });
        }
      } catch (error) {
        console.error('Error checking user data:', error);
        navigate('/login', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
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

      // Extract user_billing_cycle from response if available
      if (result.user_billing_cycle) {
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

      // Extract user_billing_cycle from response if available
      if (result.user_billing_cycle) {
        setBillingCycle(result.user_billing_cycle);
      }
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to load subscription plans. Please try again.');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
      solo: 'Perfect for individual tax preparers',
      professional: 'Ideal for small firms',
      team: 'Best for growing teams',
      enterprise: 'Complete solution for large organizations'
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
        solo: [
          'Up to 1 User',
          '50 Client Accounts',
          '10 GB Storage',
          '25 E-Signature Requests/month',
          '1 Office Location Included',
          'Email Support'
        ],
        team: [
          'Up to 10 Users',
          '500 Client Accounts',
          '50 GB Storage',
          '100 E-Signature Requests/month',
          '1 Office Location Included',
          'Priority Email Support'
        ],
        professional: [
          'Up to 25 Users',
          '1000 Client Accounts',
          '100 GB Storage',
          '250 E-Signature Requests/month',
          '3 Office Locations Included',
          'Priority Support',
          'Advanced Analytics'
        ],
        enterprise: [
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

      // Build success and cancel URLs
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/firmadmin?subscription_success=true`;
      const cancelUrl = `${baseUrl}/firmadmin/finalize-subscription?subscription_cancelled=true`;

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
      <div className="min-h-screen bg-[#F6F7FF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3AD6F2] mx-auto mb-4"></div>
          <p className="text-gray-600 font-[BasisGrotesquePro]">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FF] py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">
            Finalize Your Subscription
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 font-[BasisGrotesquePro] px-4">
            Please select a subscription plan to continue using the platform
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 mx-2 sm:mx-0">
            <p className="text-xs sm:text-sm text-red-700 font-[BasisGrotesquePro]">{error}</p>
          </div>
        )}

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="bg-white rounded-lg p-1 border border-gray-200 inline-flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 sm:px-6 py-2 rounded-md text-sm sm:text-base font-medium transition-colors font-[BasisGrotesquePro] ${
                billingCycle === 'monthly'
                  ? 'bg-[#3AD6F2] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 sm:px-6 py-2 rounded-md text-sm sm:text-base font-medium transition-colors font-[BasisGrotesquePro] ${
                billingCycle === 'yearly'
                  ? 'bg-[#3AD6F2] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        {plans.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
                  className={`bg-white rounded-lg border-2 p-4 sm:p-6 cursor-pointer transition-all hover:shadow-lg relative flex flex-col h-full ${
                    isSelected
                      ? 'border-[#3AD6F2] shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${plan.most_popular ? 'ring-2 ring-orange-200' : ''}`}
                >
                  {plan.most_popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="bg-[#F56D2D] text-white px-2 sm:px-3 py-1 rounded-full text-xs font-semibold font-[BasisGrotesquePro] whitespace-nowrap">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  {/* Plan Header */}
                  <div className="text-center mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">
                      {planName}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 font-[BasisGrotesquePro]">
                      {getPlanDescription(plan.subscription_type)}
                    </p>
                    <div className="mb-3 sm:mb-4">
                      <span className="text-2xl sm:text-3xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                        {priceDisplay}
                      </span>
                      {billingCycle === 'yearly' && plan.monthly_equivalent && (
                        <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-1">
                          ${parseFloat(plan.monthly_equivalent).toFixed(2)}/month
                        </div>
                      )}
                      {billingCycle === 'monthly' && plan.yearly_equivalent && (
                        <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-1">
                          ${parseFloat(plan.yearly_equivalent).toFixed(2)}/year
                        </div>
                      )}
                    </div>
                    {billingCycle === 'yearly' && plan.discount_percentage && plan.discount_percentage > 0 && (
                      <div className="mb-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 font-[BasisGrotesquePro]">
                          Save {plan.discount_percentage || plan.discount_percentage_yearly}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Plan Features */}
                  <div className="flex-1 mb-4">
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 font-[BasisGrotesquePro]">
                        Features:
                      </h4>
                      <ul className="space-y-2 text-left">
                        {features.length > 0 ? (
                          features.map((feature, index) => (
                            <li key={index} className="flex items-start text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">
                              <svg className="w-4 h-4 text-[#3AD6F2] mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>{feature}</span>
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
                    <div className="mt-auto pt-4 border-t border-gray-200">
                      <span className="inline-flex items-center justify-center w-full px-3 py-2 rounded-lg text-sm font-medium bg-[#3AD6F2] text-white font-[BasisGrotesquePro]">
                        Selected
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6 sm:p-8 text-center">
            <p className="text-sm sm:text-base text-gray-600 font-[BasisGrotesquePro]">No subscription plans available</p>
          </div>
        )}

        {/* Finalize Button */}
        <div className="flex justify-center px-2 sm:px-0">
          <button
            onClick={handleFinalizeSubscription}
            disabled={!selectedPlan || processing}
            className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-[#F56D2D] text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro]"
          >
            {processing ? 'Processing...' : 'Finalize Subscription'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalizeSubscription;

