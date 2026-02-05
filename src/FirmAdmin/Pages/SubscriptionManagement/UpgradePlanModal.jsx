import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError, firmAdminSubscriptionAPI, firmAdminPaymentMethodsAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import StripePaymentForm from './StripePaymentForm';

const API_BASE_URL = getApiBaseUrl();

const UpgradePlanModal = ({ isOpen, onClose, currentPlanName }) => {
    const location = useLocation();
    const [allPlans, setAllPlans] = useState({ monthly: [], yearly: [] }); // Store both monthly and yearly plans
    const [plans, setPlans] = useState([]); // Currently displayed plans based on billingCycle
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
    const [userBillingCycle, setUserBillingCycle] = useState(null); // User's current billing cycle from API
    const [processing, setProcessing] = useState(false);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [showAddNewCard, setShowAddNewCard] = useState(false);
    const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
    const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(null);

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

            // Handle new response structure with monthly_plans and yearly_plans
            let monthlyPlansData = [];
            let yearlyPlansData = [];

            if (result.success && result.data) {
                // New structure: data.monthly_plans and data.yearly_plans
                if (result.data.monthly_plans && result.data.yearly_plans) {
                    monthlyPlansData = result.data.monthly_plans || [];
                    yearlyPlansData = result.data.yearly_plans || [];
                }
                // Fallback: old structure with flat array
                else if (Array.isArray(result.data)) {
                    monthlyPlansData = result.data.filter(plan => plan.billing_cycle === 'monthly');
                    yearlyPlansData = result.data.filter(plan => plan.billing_cycle === 'yearly');
                } else if (result.data.plans && Array.isArray(result.data.plans)) {
                    // Nested plans structure (old format)
                    monthlyPlansData = result.data.plans.filter(plan => plan.billing_cycle === 'monthly');
                    yearlyPlansData = result.data.plans.filter(plan => plan.billing_cycle === 'yearly');
                }
            } else if (Array.isArray(result)) {
                // Direct array response (old format)
                monthlyPlansData = result.filter(plan => plan.billing_cycle === 'monthly');
                yearlyPlansData = result.filter(plan => plan.billing_cycle === 'yearly');
            }

            // Store both monthly and yearly plans
            setAllPlans({ monthly: monthlyPlansData, yearly: yearlyPlansData });

            // Extract user_billing_cycle from response and set initial billing cycle
            if (result.user_billing_cycle) {
                setUserBillingCycle(result.user_billing_cycle);
                setBillingCycle(result.user_billing_cycle);
            }

            // Set the currently displayed plans based on billingCycle
            const currentPlans = billingCycle === 'monthly' ? monthlyPlansData : yearlyPlansData;
            setPlans(currentPlans);
        } catch (err) {
            console.error('Error fetching subscription plans:', err);
            const errorMsg = handleAPIError(err);
            setError(errorMsg || 'Failed to load subscription plans. Please try again.');
            setPlans([]);
        } finally {
            setLoading(false);
        }
    }, [billingCycle]);

    // Fetch saved payment methods
    const fetchSavedPaymentMethods = useCallback(async () => {
        try {
            setLoadingPaymentMethods(true);
            const response = await firmAdminPaymentMethodsAPI.getPaymentMethods();

            // Handle different response structures
            let methods = [];
            if (response.success && response.data) {
                if (Array.isArray(response.data)) {
                    methods = response.data;
                } else if (response.data.payment_methods && Array.isArray(response.data.payment_methods)) {
                    methods = response.data.payment_methods;
                }
            } else if (Array.isArray(response)) {
                methods = response;
            }

            setSavedPaymentMethods(methods);

            // Auto-select primary payment method if available
            const primaryMethod = methods.find(m => m.is_primary || m.isPrimary);
            if (primaryMethod && primaryMethod.id) {
                // Always use the Django database ID (method.id) for saved payment methods
                setSelectedPaymentMethodId(primaryMethod.id);
            }
        } catch (err) {
            console.error('Error fetching payment methods:', err);
            setSavedPaymentMethods([]);
        } finally {
            setLoadingPaymentMethods(false);
        }
    }, []);

    // Fetch plans when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchSavedPaymentMethods();
            setSelectedPlan(null);
            setShowPaymentForm(false);
            setShowAddNewCard(false);
            setSelectedPaymentMethodId(null);
            // billingCycle will be set from API response (user_billing_cycle)
            // Fallback to 'monthly' if API doesn't provide it
            if (!userBillingCycle) {
                setBillingCycle('monthly');
            }
        }
    }, [isOpen, fetchSavedPaymentMethods, userBillingCycle]);

    // Fetch plans when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchPlans();
        }
    }, [isOpen, fetchPlans]);

    // Update displayed plans when billing cycle changes (no need to refetch)
    useEffect(() => {
        if (isOpen && allPlans.monthly.length > 0 || allPlans.yearly.length > 0) {
            const currentPlans = billingCycle === 'monthly' ? allPlans.monthly : allPlans.yearly;
            setPlans(currentPlans);
            // Clear selected plan when switching billing cycles
            setSelectedPlan(null);
        }
    }, [billingCycle, allPlans, isOpen]);

    // Format plan type name
    const formatPlanType = (type) => {
        if (!type) return 'Plan';
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    // Check if a plan is the current plan (must match both plan type and billing cycle)
    const isCurrentPlan = (plan) => {
        if (!currentPlanName || !userBillingCycle) return false;

        const currentPlan = currentPlanName.toLowerCase().trim();

        // Check if plan type matches
        const planType = (plan.subscription_type || '').toLowerCase();

        // Also check against display name fields
        const displayName = (plan.display_name || '').toLowerCase();
        const computedDisplayName = (plan.display_name_computed || '').toLowerCase();

        let planTypeMatches = (
            planType === currentPlan ||
            displayName === currentPlan ||
            computedDisplayName === currentPlan ||
            formatPlanType(planType).toLowerCase() === currentPlan
        );

        // Handle legacy mappings
        if (!planTypeMatches) {
            const mappings = {
                'growth': 'team',
                'team': 'growth',
                'pro': 'professional',
                'professional': 'pro',
                'elite': 'enterprise',
                'enterprise': 'elite',
                'starter': 'solo',
                'solo': 'starter'
            };
            if (mappings[planType] === currentPlan) planTypeMatches = true;
        }

        // Check if billing cycle matches (compare against user's actual billing cycle, not the toggle state)
        // A plan is current only if it matches the user's billing cycle
        const billingCycleMatches = billingCycle === userBillingCycle;

        // Plan is current only if both plan type AND billing cycle match
        return planTypeMatches && billingCycleMatches;
    };

    // Get plan description based on subscription type or API data
    const getPlanDescription = (plan) => {
        if (typeof plan === 'string') {
            const descriptions = {
                starter: 'Perfect for individual practitioners',
                growth: 'Great for small to medium firms',
                pro: 'Ideal for growing practices',
                elite: 'For large firms with custom needs'
            };
            return descriptions[plan.toLowerCase()] || 'Subscription plan';
        }

        if (plan && plan.description) {
            return plan.description;
        }

        const type = (plan?.subscription_type || '').toLowerCase();
        const descriptions = {
            starter: 'Perfect for individual practitioners',
            growth: 'Great for small to medium firms',
            pro: 'Ideal for growing practices',
            elite: 'For large firms with custom needs'
        };
        return descriptions[type] || 'Subscription plan';
    };

    // Get display name (custom or default)
    const getDisplayName = (plan) => {
        if (!plan) return 'Plan';
        return plan.display_name_computed || plan.display_name || formatPlanType(plan.subscription_type);
    };

    // Get default features based on subscription type
    const getDefaultFeatures = (type) => {
        const features = {
            starter: [
                'Basic client management',
                '150 Client Accounts',
                'Document storage',
                'Email support',
                'Standard reporting'
            ],
            growth: [
                'Up to 10 team members',
                '500 Client Accounts',
                'Advanced client management',
                'Enhanced document storage',
                'Priority email support'
            ],
            pro: [
                'Up to 25 team members',
                '1000 Client Accounts',
                'Full client management suite',
                'Unlimited document storage',
                'Priority support',
                'Advanced analytics'
            ],
            elite: [
                'Unlimited everything',
                'Custom client management',
                'Unlimited storage',
                '24/7 priority support',
                'Advanced analytics & reporting',
                'Dedicated account manager'
            ]
        };
        return features[type] || [];
    };

    // Handle Pay Now button click - proceed directly to Stripe checkout (no card selection)
    const handlePayNow = async () => {
        if (!selectedPlan) {
            toast.error('Please select a plan', {
                position: 'top-right',
                autoClose: 3000,
                pauseOnHover: false
            });
            return;
        }

        // Proceed directly with subscription upgrade without payment method ID
        // This will redirect to Stripe checkout
        await handleSubscriptionUpgrade();
    };

    // Handle using selected saved payment method
    const handleUseSavedPaymentMethod = async () => {
        if (!selectedPaymentMethodId) {
            toast.error('Please select a payment method', {
                position: 'top-right',
                autoClose: 3000,
                pauseOnHover: false
            });
            return;
        }

        // Find the selected payment method by Django database ID
        // selectedPaymentMethodId should always be the Django database ID (method.id)
        const selectedMethod = savedPaymentMethods.find(m => m.id === selectedPaymentMethodId);

        if (!selectedMethod) {
            toast.error('Selected payment method not found', {
                position: 'top-right',
                autoClose: 3000,
                pauseOnHover: false
            });
            return;
        }

        // For saved payment methods, pass the Django payment method ID (database ID)
        // The backend will look up the Stripe payment method ID from its database and use it
        // This prevents redirecting to Stripe checkout and uses the saved payment method directly
        await handlePaymentSubmit(selectedPaymentMethodId, true); // true indicates it's a Django ID
    };

    // Handle adding new card
    const handleAddNewCard = () => {
        setShowAddNewCard(true);
    };

    // Handle subscription upgrade - proceed directly to Stripe checkout (no payment method required)
    const handleSubscriptionUpgrade = async () => {
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

            // Build success and cancel URLs - use current page with base path
            const baseUrl = window.location.origin;
            const basePath = '/seqwens-frontend'; // Base path from vite.config.js
            const currentPath = location.pathname;
            // Ensure base path is included in the URL
            const pathWithBase = currentPath.startsWith(basePath) ? currentPath : `${basePath}${currentPath}`;
            const successUrl = `${baseUrl}${pathWithBase}?subscription_success=true`;
            const cancelUrl = `${baseUrl}${pathWithBase}?subscription_cancelled=true`;

            // Call the change subscription API without payment method ID
            // This will redirect to Stripe checkout for payment
            const response = await firmAdminSubscriptionAPI.changeSubscription(
                selectedPlan.id,
                billingCycle, // "monthly" or "yearly"
                "stripe", // payment_method
                true, // change_immediately
                successUrl, // success_url
                cancelUrl // cancel_url
                // No paymentMethodId - will redirect to Stripe checkout
            );

            if (response.success) {
                // Check if checkout URL is provided (Stripe checkout flow)
                if (response.data?.checkout_url) {
                    // Redirect to Stripe checkout
                    window.location.href = response.data.checkout_url;
                } else {
                    // Success - subscription updated (shouldn't happen without checkout_url, but handle it)
                    const planName = response.data?.new_plan?.subscription_type_display ||
                        response.data?.new_plan?.subscription_type ||
                        selectedPlan.subscription_type ||
                        'selected plan';

                    toast.success(response.message || `Subscription plan changed to ${planName} successfully!`, {
                        position: 'top-right',
                        autoClose: 5000,
                        pauseOnHover: false
                    });

                    onClose();

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
        }
    };

    // Handle payment form submission with payment method ID (legacy function - kept for backward compatibility if needed)
    const handlePaymentSubmit = async (paymentMethodId, isDjangoId = false) => {
        if (!selectedPlan || !paymentMethodId) {
            toast.error('Payment information is missing. Please try again.', {
                position: 'top-right',
                autoClose: 3000,
                pauseOnHover: false
            });
            return;
        }

        try {
            setProcessing(true);

            // Build success and cancel URLs - use current page with base path
            const baseUrl = window.location.origin;
            const basePath = '/seqwens-frontend'; // Base path from vite.config.js
            const currentPath = location.pathname;
            // Ensure base path is included in the URL
            const pathWithBase = currentPath.startsWith(basePath) ? currentPath : `${basePath}${currentPath}`;
            const successUrl = `${baseUrl}${pathWithBase}?subscription_success=true`;
            const cancelUrl = `${baseUrl}${pathWithBase}?subscription_cancelled=true`;

            // Call the change subscription API with payment method ID
            // If isDjangoId is true, pass it as saved_payment_method_id instead
            const response = await firmAdminSubscriptionAPI.changeSubscription(
                selectedPlan.id,
                billingCycle, // "monthly" or "yearly"
                "stripe", // payment_method
                true, // change_immediately
                successUrl, // success_url
                cancelUrl, // cancel_url
                paymentMethodId, // payment_method_id (Stripe PM ID) or saved_payment_method_id (Django ID)
                isDjangoId // flag to indicate if it's a Django ID
            );

            if (response.success) {
                // If checkout URL is still provided (fallback), redirect to it
                if (response.data?.checkout_url) {
                    window.location.href = response.data.checkout_url;
                } else {
                    // Success - subscription updated with payment method
                    const planName = response.data?.new_plan?.subscription_type_display ||
                        response.data?.new_plan?.subscription_type ||
                        selectedPlan.subscription_type ||
                        'selected plan';

                    toast.success(response.message || `Subscription plan changed to ${planName} successfully!`, {
                        position: 'top-right',
                        autoClose: 5000,
                        pauseOnHover: false
                    });

                    onClose();

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
        }
    };

    // Handle payment form cancellation
    const handlePaymentCancel = () => {
        setShowPaymentForm(false);
        setShowAddNewCard(false);
        setSelectedPaymentMethodId(null);
    };

    // Get card brand icon
    const getCardBrandIcon = (brand) => {
        const brandLower = (brand || '').toLowerCase();
        if (brandLower.includes('visa')) return '💳';
        if (brandLower.includes('mastercard') || brandLower.includes('master')) return '💳';
        if (brandLower.includes('amex') || brandLower.includes('american')) return '💳';
        if (brandLower.includes('discover')) return '💳';
        return '💳';
    };

    // Format card display
    const formatCardDisplay = (method) => {
        const last4 = method.last4 || method.card_last4 || (method.card_number ? method.card_number.slice(-4) : '****');
        const brand = method.brand || method.card_brand || method.card_type || 'Card';
        const expiry = method.expiry || method.expiry_date || (method.exp_month && method.exp_year ? `${String(method.exp_month).padStart(2, '0')}/${String(method.exp_year).slice(-2)}` : 'N/A');
        const name = method.cardholder_name || method.name || method.billing_details?.name || 'Cardholder';
        return { last4, brand, expiry, name };
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={onClose}>
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
                    {/* Payment Form Section */}
                    {showPaymentForm && selectedPlan && (
                        <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="mb-4">
                                <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro] mb-2">
                                    Payment Information
                                </h5>
                                <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                                    Complete your payment to upgrade to the <strong>{getDisplayName(selectedPlan)}</strong> plan
                                    {billingCycle === 'monthly' ? ' (Monthly)' : ' (Yearly)'}.
                                </p>
                            </div>

                            {/* Show saved payment methods or add new card form */}
                            {showAddNewCard ? (
                                // Add New Card Form
                                <div>
                                    <div className="mb-4 flex items-center justify-between">
                                        <h6 className="text-md font-semibold text-gray-900 font-[BasisGrotesquePro]">
                                            Add New Card
                                        </h6>
                                        <button
                                            onClick={() => setShowAddNewCard(false)}
                                            className="text-sm text-gray-600 hover:text-gray-900 font-[BasisGrotesquePro]"
                                        >
                                            ← Back to saved cards
                                        </button>
                                    </div>
                                    <StripePaymentForm
                                        onSubmit={handlePaymentSubmit}
                                        onCancel={handlePaymentCancel}
                                        processing={processing}
                                    />
                                </div>
                            ) : (
                                // Saved Payment Methods Selection
                                <div>
                                    {loadingPaymentMethods ? (
                                        <div className="text-center py-8">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading payment methods...</p>
                                        </div>
                                    ) : savedPaymentMethods.length > 0 ? (
                                        <>
                                            <h6 className="text-md font-semibold text-gray-900 font-[BasisGrotesquePro] mb-4">
                                                Select Payment Method
                                            </h6>
                                            <div className="space-y-3 mb-4">
                                                {savedPaymentMethods.map((method) => {
                                                    const cardInfo = formatCardDisplay(method);
                                                    // Always use the Django database ID (method.id) for saved payment methods
                                                    // This is what the backend expects to identify which saved payment method to use
                                                    const djangoMethodId = method.id;
                                                    const isSelected = selectedPaymentMethodId === djangoMethodId;
                                                    const isPrimary = method.is_primary || method.isPrimary;

                                                    return (
                                                        <div
                                                            key={djangoMethodId}
                                                            onClick={() => setSelectedPaymentMethodId(djangoMethodId)}
                                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                                                                ? 'border-[#3AD6F2] bg-blue-50'
                                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                                        <span className="text-xl">{getCardBrandIcon(cardInfo.brand)}</span>
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-semibold text-gray-900 font-[BasisGrotesquePro]">
                                                                                {cardInfo.brand} •••• {cardInfo.last4}
                                                                            </span>
                                                                            {isPrimary && (
                                                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium font-[BasisGrotesquePro]">
                                                                                    Primary
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                                                                            {cardInfo.name} • Expires {cardInfo.expiry}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {isSelected && (
                                                                    <div className="w-6 h-6 bg-[#3AD6F2] rounded-full flex items-center justify-center">
                                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleUseSavedPaymentMethod}
                                                    disabled={!selectedPaymentMethodId || processing}
                                                    className="flex-1 px-6 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro]"
                                                    style={{ backgroundColor: '#F97316' }}
                                                >
                                                    {processing ? 'Processing...' : 'Use Selected Card'}
                                                </button>
                                                <button
                                                    onClick={handleAddNewCard}
                                                    disabled={processing}
                                                    className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 font-[BasisGrotesquePro]"
                                                >
                                                    Add New Card
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        // No saved payment methods - show add new card form directly
                                        <div>
                                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-4">
                                                No saved payment methods. Please add a new card to continue.
                                            </p>
                                            <StripePaymentForm
                                                onSubmit={handlePaymentSubmit}
                                                onCancel={handlePaymentCancel}
                                                processing={processing}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Plans Selection Section - Hide when payment form is shown */}
                    {!showPaymentForm && (
                        <>
                            {/* Billing Cycle Toggle */}
                            <div className="mb-6 flex justify-center">
                                <div className="bg-gray-50 rounded-lg border border-gray-200 p-1.5 inline-flex gap-2">
                                    <button
                                        onClick={() => setBillingCycle('monthly')}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors font-[BasisGrotesquePro] ${billingCycle === 'monthly'
                                            ? 'bg-[#3AD6F2] text-white'
                                            : 'bg-transparent text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        onClick={() => setBillingCycle('yearly')}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors font-[BasisGrotesquePro] ${billingCycle === 'yearly'
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
                                    {plans.map((plan) => {
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
                                                className={`bg-white rounded-lg border p-5 relative cursor-pointer transition-all ${isCurrent
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

                                                {/* Custom Badge or Most Popular Badge */}
                                                {!isCurrent && (plan.badge_text || isMostPopular) && (
                                                    <span
                                                        className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 text-white rounded-full text-xs font-medium font-[BasisGrotesquePro] whitespace-nowrap z-10"
                                                        style={{ backgroundColor: plan.badge_color || '#F56D2D' }}
                                                    >
                                                        {plan.badge_text || 'Most Popular'}
                                                    </span>
                                                )}

                                                {/* Plan Header */}
                                                <div className={isMostPopular || isCurrent ? 'mt-2' : ''}>
                                                    <h5 className="text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">
                                                        {getDisplayName(plan)}
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
                                                        {getPlanDescription(plan)}
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
                        </>
                    )}
                </div>

                {/* Footer - Only show when payment form is not visible */}
                {!showPaymentForm && (
                    <div className="flex justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
                        <button
                            onClick={onClose}
                            disabled={processing}
                            className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 font-[BasisGrotesquePro]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePayNow}
                            disabled={!selectedPlan || processing || isCurrentPlan(selectedPlan)}
                            className="px-6 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro]"
                            style={{ backgroundColor: '#F97316' }}
                        >
                            Pay Now
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpgradePlanModal;

