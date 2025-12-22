import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError, firmAdminSubscriptionAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

const API_BASE_URL = getApiBaseUrl();

const AllPlans = ({ currentPlanName }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
    const [showUpgradeConfirmModal, setShowUpgradeConfirmModal] = useState(false);
    const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Fetch subscription plans from API
    const fetchPlans = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const token = getAccessToken();

            // Try public endpoint first (as specified in the API docs)
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
                        plan.billing_cycle === billingCycle && plan.is_active !== false
                    );
                }
            } else if (Array.isArray(result)) {
                // Direct array response (old format)
                plansData = result.filter(plan => 
                    plan.billing_cycle === billingCycle && plan.is_active !== false
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

            // Filter only active plans
            const filteredPlans = plansData.filter(plan => plan.is_active !== false);

            setPlans(filteredPlans);
        } catch (err) {
            console.error('Error fetching subscription plans:', err);
            const errorMsg = handleAPIError(err);
            setError(errorMsg || 'Failed to load subscription plans. Please try again.');
            setPlans([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch plans on mount and when billing cycle changes
    useEffect(() => {
        fetchPlans();
    }, [fetchPlans, billingCycle]);

    // Format plan type name
    const formatPlanType = (type) => {
        if (!type) return 'Plan';
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    // Check if a plan is the current plan
    const isCurrentPlan = (plan) => {
        // Use is_current field from API if available
        if (plan.is_current !== undefined) {
            return plan.is_current === true;
        }
        // Fallback to old method
        if (!currentPlanName) return false;
        const planType = formatPlanType(plan.subscription_type).toLowerCase();
        const currentPlan = currentPlanName.toLowerCase();
        return planType === currentPlan;
    };

    // Get plan description based on subscription type
    const getPlanDescription = (type) => {
        const descriptions = {
            solo: 'Perfect for individual practitioners',
            team: 'Great for small to medium firms',
            professional: 'Ideal for growing practices',
            enterprise: 'For large firms with custom needs'
        };
        return descriptions[type] || 'Subscription plan';
    };

    // Get default features based on subscription type
    const getDefaultFeatures = (type) => {
        const features = {
            solo: [
                'Basic client management',
                'Document storage',
                'Email support',
                'Standard reporting',
                '1 Office Location Included'
            ],
            team: [
                'Up to 5 team members',
                'Advanced client management',
                'Enhanced document storage',
                'Priority email support',
                'Advanced reporting',
                '1 Office Location Included'
            ],
            professional: [
                'Unlimited team members',
                'Full client management suite',
                'Unlimited document storage',
                'Priority support',
                'Advanced analytics',
                'Custom integrations',
                '3 Office Locations Included'
            ],
            enterprise: [
                'Unlimited everything',
                'Custom client management',
                'Unlimited storage',
                '24/7 priority support',
                'Advanced analytics & reporting',
                'Custom integrations',
                'Dedicated account manager',
                '5 Office Locations Included'
            ]
        };
        return features[type] || [];
    };

    // Get available addons for a plan
    const getAvailableAddons = (plan) => {
        const addons = [];
        if (plan.additional_storage_addon) {
            addons.push('Additional Storage');
        }
        if (plan.additional_user_addon) {
            addons.push('Additional Users');
        }
        if (plan.priority_support_addon) {
            addons.push('Priority Support');
        }
        return addons;
    };

    // Handle upgrade button click
    const handleUpgradeClick = (plan) => {
        setSelectedPlanForUpgrade(plan);
        setShowUpgradeConfirmModal(true);
    };

    // Handle upgrade confirmation
    const handleUpgradeConfirm = async () => {
        if (!selectedPlanForUpgrade) return;

        try {
            setProcessing(true);
            setShowUpgradeConfirmModal(false);

            // Call the change subscription API
            const response = await firmAdminSubscriptionAPI.changeSubscription(
                selectedPlanForUpgrade.id,
                billingCycle, // "monthly" or "yearly"
                "stripe", // payment_method
                true // change_immediately
            );

            if (response.success) {
                // Check if checkout URL is provided (Stripe checkout flow)
                if (response.data?.checkout_url) {
                    // Redirect to Stripe checkout
                    window.location.href = response.data.checkout_url;
                } else {
                    // If no checkout URL, show success message and reload
                    const planName = response.data?.new_plan?.subscription_type_display || 
                                    response.data?.new_plan?.subscription_type || 
                                    selectedPlanForUpgrade.subscription_type || 
                                    'selected plan';
                    
                    toast.success(response.message || `Subscription plan changed to ${planName} successfully!`, {
                        position: 'top-right',
                        autoClose: 5000,
                        pauseOnHover: false
                    });
                    
                    // Refresh the page to show updated subscription details
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            } else {
                throw new Error(response.message || 'Failed to change subscription plan');
            }
        } catch (err) {
            console.error('Error changing subscription plan:', err);
            toast.error(handleAPIError(err) || 'Failed to change subscription plan. Please try again.', {
                position: 'top-right',
                autoClose: 5000,
                pauseOnHover: false
            });
        } finally {
            setProcessing(false);
            setSelectedPlanForUpgrade(null);
        }
    };

    return (
        <div>
            {/* Billing Cycle Toggle */}
            <div className="mb-6 flex justify-center">
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-1.5 inline-flex gap-2">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-4 py-2 text-sm font-medium !rounded-lg transition-colors font-[BasisGrotesquePro] ${billingCycle === 'monthly'
                            ? 'bg-[#3AD6F2] text-white'
                            : 'bg-transparent text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-4 py-2 text-sm font-medium !rounded-lg transition-colors font-[BasisGrotesquePro] ${billingCycle === 'yearly'
                            ? 'bg-[#3AD6F2] text-white'
                            : 'bg-transparent text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Yearly
                        {billingCycle === 'yearly' && plans.length > 0 && (
                            <span className="ml-1 text-xs">
                                (Save up to {Math.max(...plans.map(p => p.discount_percentage || p.discount_percentage_yearly || 0))}%)
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-sm text-gray-600">Loading subscription plans...</p>
                </div>
            ) : plans.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-sm text-gray-600">No subscription plans available</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
                    {plans.map((plan) => {
                            // Use price from API response (already filtered by billing_cycle)
                            const price = parseFloat(plan.price || plan.monthly_price || plan.yearly_price || 0);
                            const priceDisplay = plan.price_display || `$${price.toFixed(2)}/${billingCycle === 'monthly' ? 'month' : 'year'}`;
                            const isCustomPricing = plan.custom_pricing === 'enabled';
                            const isMostPopular = plan.most_popular || false;
                            const discountPercentage = plan.discount_percentage || plan.discount_percentage_yearly || 0;
                            const availableAddons = getAvailableAddons(plan);
                            const isCurrent = isCurrentPlan(plan);

                            return (
                                <div
                                    key={plan.id}
                                    className={`bg-white !rounded-lg !border p-4 sm:p-5 lg:p-6 relative shadow-sm ${
                                        isCurrent
                                            ? '!border-2 border-[#3AD6F2] ring-2 ring-[#3AD6F2] ring-opacity-20'
                                            : isMostPopular
                                            ? '!border-2 border-[#F56D2D]'
                                            : 'border-[#E8F0FF]'
                                        }`}
                                >
                                    {/* Current Plan Badge */}
                                    {isCurrent && (
                                        <span className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 px-2 sm:px-3 py-0.5 sm:py-1 bg-[#3AD6F2] text-white !rounded-full text-[10px] sm:text-xs font-medium font-[BasisGrotesquePro] whitespace-nowrap z-10">
                                            Current Plan
                                        </span>
                                    )}
                                    {/* Most Popular Badge */}
                                    {isMostPopular && !isCurrent && (
                                        <span className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 px-2 sm:px-3 py-0.5 sm:py-1 bg-[#F56D2D] text-white !rounded-full text-[10px] sm:text-xs font-medium font-[BasisGrotesquePro] whitespace-nowrap">
                                            Most Popular
                                        </span>
                                    )}

                                    {/* Plan Header */}
                                    <div className={(isMostPopular || isCurrent) ? 'mt-2' : ''}>
                                        <h5 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">
                                            {formatPlanType(plan.subscription_type)}
                                        </h5>
                                        <div className="mb-2">
                                            {isCustomPricing ? (
                                                <span className="text-base sm:text-lg font-semibold text-gray-600 font-[BasisGrotesquePro]">
                                                    Custom pricing
                                                </span>
                                            ) : (
                                                <>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-2xl sm:text-3xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                                                            {priceDisplay}
                                                        </span>
                                                    </div>
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
                                                    {billingCycle === 'yearly' && discountPercentage > 0 && (
                                                        <div className="mt-1">
                                                            <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded font-[BasisGrotesquePro]">
                                                                Save {discountPercentage}%
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro] mb-4 sm:mb-6">
                                            {getPlanDescription(plan.subscription_type)}
                                        </p>
                                    </div>

                                    {/* Features List */}
                                    <div className="mb-4 sm:mb-6">
                                        <h6 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 font-[BasisGrotesquePro]">
                                            Features
                                        </h6>
                                        <div className="space-y-1.5 sm:space-y-2">
                                            {(plan.features_list && plan.features_list.length > 0) ? (
                                                <>
                                                    {plan.features_list.map((feature, index) => (
                                                    <div key={index} className="flex items-center gap-1.5 sm:gap-2">
                                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <span className="text-xs sm:text-sm text-gray-700 font-[BasisGrotesquePro]">
                                                            {feature}
                                                        </span>
                                                    </div>
                                                    ))}
                                                    {/* Add included_offices if not in features_list */}
                                                    {plan.included_offices !== undefined && plan.included_offices !== null && 
                                                     !plan.features_list.some(f => f.toLowerCase().includes('office')) && (
                                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span className="text-xs sm:text-sm text-gray-700 font-[BasisGrotesquePro]">
                                                                {plan.included_offices} {plan.included_offices === 1 ? 'Office Location' : 'Office Locations'} Included
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            ) : getDefaultFeatures(plan.subscription_type).length > 0 ? (
                                                <>
                                                    {getDefaultFeatures(plan.subscription_type).map((feature, index) => (
                                                    <div key={index} className="flex items-center gap-1.5 sm:gap-2">
                                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <span className="text-xs sm:text-sm text-gray-700 font-[BasisGrotesquePro]">
                                                            {feature}
                                                        </span>
                                                    </div>
                                                    ))}
                                                    {/* Add included_offices if available */}
                                                    {plan.included_offices !== undefined && plan.included_offices !== null && (
                                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span className="text-xs sm:text-sm text-gray-700 font-[BasisGrotesquePro]">
                                                                {plan.included_offices} {plan.included_offices === 1 ? 'Office Location' : 'Office Locations'} Included
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">
                                                    Standard features included
                                                </p>
                                                    {/* Add included_offices if available */}
                                                    {plan.included_offices !== undefined && plan.included_offices !== null && (
                                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span className="text-xs sm:text-sm text-gray-700 font-[BasisGrotesquePro]">
                                                                {plan.included_offices} {plan.included_offices === 1 ? 'Office Location' : 'Office Locations'} Included
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Custom Pricing Status */}
                                    {plan.custom_pricing === 'enabled' && (
                                        <div className="mb-4 sm:mb-6">
                                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-xs sm:text-sm text-blue-700 font-[BasisGrotesquePro] font-medium">
                                                    Custom pricing available - Contact sales for details
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Addons List */}
                                    {availableAddons.length > 0 ? (
                                        <div className="mb-4 sm:mb-6">
                                            <h6 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 font-[BasisGrotesquePro]">
                                                Available Add-ons
                                            </h6>
                                            <div className="space-y-1.5 sm:space-y-2">
                                                {availableAddons.map((addon, index) => (
                                                    <div key={index} className="flex items-center gap-1.5 sm:gap-2">
                                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                        <span className="text-xs sm:text-sm text-gray-700 font-[BasisGrotesquePro]">
                                                            {addon}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : plan.addons_list && plan.addons_list.length > 0 ? (
                                        // Fallback to addons_list if available (for backward compatibility)
                                        <div className="mb-4 sm:mb-6">
                                            <h6 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 font-[BasisGrotesquePro]">
                                                Available Add-ons
                                            </h6>
                                            <div className="space-y-1.5 sm:space-y-2">
                                                {plan.addons_list.map((addon, index) => (
                                                    <div key={index} className="flex items-center gap-1.5 sm:gap-2">
                                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                        <span className="text-xs sm:text-sm text-gray-700 font-[BasisGrotesquePro]">
                                                            {addon}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-4 sm:mb-6">
                                            <h6 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 font-[BasisGrotesquePro]">
                                                Add-ons
                                            </h6>
                                            <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">
                                                No add-ons available for this plan
                                            </p>
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <button
                                        onClick={() => !isCurrent && !isCustomPricing && handleUpgradeClick(plan)}
                                        className={`w-full px-3 sm:px-4 py-2 !rounded-lg transition-colors font-[BasisGrotesquePro] text-xs sm:text-sm font-medium ${
                                            isCurrent
                                                ? 'bg-[#3AD6F2] text-white hover:bg-[#2BC5E0] cursor-default'
                                                : isMostPopular
                                                ? 'bg-[#F56D2D] text-white hover:bg-[#EA580C]'
                                                : isCustomPricing
                                                ? 'bg-white !border border-[#E8F0FF] text-gray-700 hover:bg-gray-50'
                                                : 'bg-white !border border-[#E8F0FF] text-gray-700 hover:bg-gray-50'
                                            }`}
                                        disabled={isCurrent || isCustomPricing}
                                    >
                                        {isCurrent ? 'Current Plan' : isCustomPricing ? 'Contact Sales' : isMostPopular ? 'Upgrade' : 'Upgrade'}
                                    </button>
                                </div>
                            );
                        })}
                </div>
            )}

            {/* Upgrade Confirmation Modal */}
            {showUpgradeConfirmModal && selectedPlanForUpgrade && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
                    onClick={() => {
                        if (!processing) {
                            setShowUpgradeConfirmModal(false);
                            setSelectedPlanForUpgrade(null);
                        }
                    }}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
                        style={{
                            borderRadius: '12px',
                            border: '1px solid #E8F0FF'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-[#E8F0FF]">
                            <h2 className="text-xl font-bold font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                                Upgrade Plan
                            </h2>
                            <button
                                onClick={() => {
                                    if (!processing) {
                                        setShowUpgradeConfirmModal(false);
                                        setSelectedPlanForUpgrade(null);
                                    }
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                                disabled={processing}
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15 5L5 15M5 5L15 15" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            <p className="text-sm text-gray-700 font-[BasisGrotesquePro] mb-2">
                                Are you sure you want to upgrade to the <span className="font-semibold">{formatPlanType(selectedPlanForUpgrade.subscription_type)}</span> plan?
                            </p>
                            <div className="bg-gray-50 rounded-lg p-4 mt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600 font-[BasisGrotesquePro]">Billing Cycle:</span>
                                    <span className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro capitalize">{billingCycle}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 font-[BasisGrotesquePro]">Price:</span>
                                    <span className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">
                                        ${(billingCycle === 'monthly' 
                                            ? parseFloat(selectedPlanForUpgrade.monthly_price || 0)
                                            : parseFloat(selectedPlanForUpgrade.yearly_price || 0)
                                        ).toFixed(2)} per {billingCycle === 'monthly' ? 'month' : 'year'}
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 font-[BasisGrotesquePro] mt-4">
                                Your subscription will be changed immediately and you will be charged accordingly.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 p-6 border-t border-[#E8F0FF]">
                            <button
                                onClick={() => {
                                    setShowUpgradeConfirmModal(false);
                                    setSelectedPlanForUpgrade(null);
                                }}
                                disabled={processing}
                                className="px-6 py-2 bg-white border border-[#E8F0FF] text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpgradeConfirm}
                                disabled={processing}
                                className="px-6 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E66F2F] transition-colors font-[BasisGrotesquePro] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Processing...' : 'Confirm Upgrade'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllPlans;

