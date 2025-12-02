import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

const API_BASE_URL = getApiBaseUrl();

const UpgradePlanModal = ({ isOpen, onClose, currentPlanName }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
    const [processing, setProcessing] = useState(false);

    // Fetch subscription plans from API
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

            // Handle different response structures
            if (result.success && result.data) {
                setPlans(Array.isArray(result.data) ? result.data : []);
            } else if (Array.isArray(result)) {
                setPlans(result);
            } else {
                setPlans([]);
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

    // Fetch plans when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchPlans();
            setSelectedPlan(null);
            setBillingCycle('monthly');
        }
    }, [isOpen, fetchPlans]);

    // Format plan type name
    const formatPlanType = (type) => {
        if (!type) return 'Plan';
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    // Check if a plan is the current plan
    const isCurrentPlan = (plan) => {
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
                'Standard reporting'
            ],
            team: [
                'Up to 5 team members',
                'Advanced client management',
                'Enhanced document storage',
                'Priority email support',
                'Advanced reporting'
            ],
            professional: [
                'Unlimited team members',
                'Full client management suite',
                'Unlimited document storage',
                'Priority support',
                'Advanced analytics',
                'Custom integrations'
            ],
            enterprise: [
                'Unlimited everything',
                'Custom client management',
                'Unlimited storage',
                '24/7 priority support',
                'Advanced analytics & reporting',
                'Custom integrations',
                'Dedicated account manager'
            ]
        };
        return features[type] || [];
    };

    // Handle Pay Now button click
    const handlePayNow = async () => {
        if (!selectedPlan) {
            toast.error('Please select a plan', {
                position: 'top-right',
                autoClose: 3000,
                pauseOnHover: false
            });
            return;
        }

        try {
            setProcessing(true);

            const token = getAccessToken();
            
            // Prepare request body according to API specification
            const requestBody = {
                subscription_plan_id: selectedPlan.id,
                billing_cycle: billingCycle, // "monthly" or "yearly"
                payment_method: "stripe" // optional, but including it
            };

            const upgradeUrl = `${API_BASE_URL}/firm-admin/subscription/upgrade/`;
            
            const response = await fetchWithCors(upgradeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.detail || 'Failed to upgrade subscription plan');
            }

            const result = await response.json();

            if (result.success) {
                const planName = result.data?.new_plan?.subscription_type_display || 
                                result.data?.new_plan?.subscription_type || 
                                'selected plan';
                
                toast.success(result.message || `Subscription plan upgraded to ${planName} successfully!`, {
                    position: 'top-right',
                    autoClose: 3000,
                    pauseOnHover: false
                });
                
                onClose();
                
                // Refresh the page to show updated subscription details
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                throw new Error(result.message || 'Failed to upgrade subscription plan');
            }
        } catch (err) {
            console.error('Error upgrading subscription plan:', err);
            toast.error(handleAPIError(err) || 'Failed to upgrade subscription plan. Please try again.', {
                position: 'top-right',
                autoClose: 3000,
                pauseOnHover: false
            });
        } finally {
            setProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
                    <h4 className="text-2xl font-bold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>
                        Upgrade Your Plan
                    </h4>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Billing Cycle Toggle */}
                    <div className="mb-6 flex justify-center">
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-1.5 inline-flex gap-2">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors font-[BasisGrotesquePro] ${
                                    billingCycle === 'monthly'
                                        ? 'bg-[#3AD6F2] text-white'
                                        : 'bg-transparent text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors font-[BasisGrotesquePro] ${
                                    billingCycle === 'yearly'
                                        ? 'bg-[#3AD6F2] text-white'
                                        : 'bg-transparent text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                Yearly
                                {billingCycle === 'yearly' && plans.length > 0 && (
                                    <span className="ml-1 text-xs">
                                        (Save up to {Math.max(...plans.map(p => p.discount_percentage_yearly || 0))}%)
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {plans
                                .filter(plan => plan.is_active !== false)
                                .map((plan) => {
                                    const price = billingCycle === 'monthly'
                                        ? parseFloat(plan.monthly_price || 0)
                                        : parseFloat(plan.yearly_price || 0);
                                    const isCustomPricing = plan.custom_pricing === 'enabled';
                                    const isMostPopular = plan.most_popular || false;
                                    const discountPercentage = plan.discount_percentage_yearly || 0;
                                    const isCurrent = isCurrentPlan(plan);
                                    const isSelected = selectedPlan?.id === plan.id;

                                    return (
                                        <div
                                            key={plan.id}
                                            onClick={() => !isCurrent && setSelectedPlan(plan)}
                                            className={`bg-white rounded-lg border p-5 relative cursor-pointer transition-all ${
                                                isCurrent
                                                    ? 'border-2 border-[#3AD6F2] ring-2 ring-[#3AD6F2] ring-opacity-20 opacity-60 cursor-not-allowed'
                                                    : isSelected
                                                    ? 'border-2 border-[#F56D2D] ring-2 ring-[#F56D2D] ring-opacity-20 shadow-lg'
                                                    : isMostPopular
                                                    ? 'border-2 border-[#F56D2D] hover:border-[#F56D2D] hover:shadow-md'
                                                    : 'border-[#E8F0FF] hover:border-[#F56D2D] hover:shadow-md'
                                            }`}
                                        >
                                            {/* Selection Indicator */}
                                            {isSelected && !isCurrent && (
                                                <div className="absolute top-3 right-3 w-6 h-6 bg-[#F56D2D] rounded-full flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}

                                            {/* Current Plan Badge */}
                                            {isCurrent && (
                                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#3AD6F2] text-white rounded-full text-xs font-medium font-[BasisGrotesquePro] whitespace-nowrap z-10">
                                                    Current Plan
                                                </span>
                                            )}

                                            {/* Most Popular Badge */}
                                            {isMostPopular && !isCurrent && (
                                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#F56D2D] text-white rounded-full text-xs font-medium font-[BasisGrotesquePro] whitespace-nowrap">
                                                    Most Popular
                                                </span>
                                            )}

                                            {/* Plan Header */}
                                            <div className={isMostPopular || isCurrent ? 'mt-2' : ''}>
                                                <h5 className="text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">
                                                    {formatPlanType(plan.subscription_type)}
                                                </h5>
                                                <div className="mb-2">
                                                    {isCustomPricing ? (
                                                        <span className="text-lg font-semibold text-gray-600 font-[BasisGrotesquePro]">
                                                            Custom pricing
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-3xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                                                                    ${price.toFixed(2)}
                                                                </span>
                                                                <span className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                                                                    per {billingCycle === 'monthly' ? 'month' : 'year'}
                                                                </span>
                                                            </div>
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
                                                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-4">
                                                    {getPlanDescription(plan.subscription_type)}
                                                </p>
                                            </div>

                                            {/* Features List */}
                                            <div className="mb-4">
                                                <h6 className="text-sm font-semibold text-gray-900 mb-3 font-[BasisGrotesquePro]">
                                                    Features
                                                </h6>
                                                <div className="space-y-2">
                                                    {(plan.features_list && plan.features_list.length > 0) ? (
                                                        plan.features_list.slice(0, 5).map((feature, index) => (
                                                            <div key={index} className="flex items-center gap-2">
                                                                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                                                                    {feature}
                                                                </span>
                                                            </div>
                                                        ))
                                                    ) : getDefaultFeatures(plan.subscription_type).slice(0, 5).map((feature, index) => (
                                                        <div key={index} className="flex items-center gap-2">
                                                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                                                                {feature}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePayNow}
                        disabled={!selectedPlan || processing || isCurrentPlan(selectedPlan)}
                        className="px-6 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#F97316' }}
                    >
                        {processing ? 'Processing...' : 'Pay Now'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpgradePlanModal;

