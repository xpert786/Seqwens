import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken, getStorage } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError, firmAdminPaymentMethodsAPI, firmAdminSubscriptionAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import AllPlans from './AllPlans';
import AddOns from './AddOns';
import Billing from './Billing';
import BillingEnhanced from './BillingEnhanced';
import AdminControls from './AdminControls';
import Security from './Security';
import Automation from './Automation';
import SavedPaymentMethods from '../Billing/SavedPaymentMethods';
import UpgradePlanModal from './UpgradePlanModal';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { useSubscriptionStatus } from '../../Context/SubscriptionStatusContext';
import './SubscriptionManagement.css';


const API_BASE_URL = getApiBaseUrl();

const SubscriptionManagement = () => {
    const { isDeveloperSubscription } = useSubscriptionStatus();
    const [searchParams, setSearchParams] = useSearchParams();

    const [activeTab, setActiveTab] = useState('Overview');
    const [isFailoverEnabled, setIsFailoverEnabled] = useState(true);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [subscriptionOverview, setSubscriptionOverview] = useState(null);
    const [isUpgradePlanModalOpen, setIsUpgradePlanModalOpen] = useState(false);
    const [cancellingSubscription, setCancellingSubscription] = useState(false);
    const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
    const [showDeletePaymentConfirm, setShowDeletePaymentConfirm] = useState(false);
    const [paymentMethodToDelete, setPaymentMethodToDelete] = useState(null);
    const [deletingPaymentMethod, setDeletingPaymentMethod] = useState(false);
    // Form state for adding payment method
    const [newPaymentMethod, setNewPaymentMethod] = useState({
        cardNumber: '',
        cardholderName: '',
        expiryDate: '',
        cvv: '',
        isDefault: false
    });

    // Form validation errors
    const [formErrors, setFormErrors] = useState({
        cardNumber: '',
        cardholderName: '',
        expiryDate: '',
        cvv: ''
    });

    const tabs = ['Overview', 'All Plan', 'Add-ons', 'Billing', 'Admin', 'Security', 'Automation'];

    // Fetch payment methods from API
    const fetchPaymentMethods = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const token = getAccessToken();
            const url = `${API_BASE_URL}/user/firm-admin/payment-methods/`;

            const response = await fetchWithCors(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Handle different response structures
            if (result.success && result.data) {
                // result.data is an array of payment methods
                setPaymentMethods(Array.isArray(result.data) ? result.data : []);
            } else if (result.payment_methods) {
                setPaymentMethods(result.payment_methods || []);
            } else if (Array.isArray(result)) {
                setPaymentMethods(result);
            } else {
                setPaymentMethods([]);
            }
        } catch (err) {
            console.error('Error fetching payment methods:', err);
            const errorMsg = handleAPIError(err);
            setError(errorMsg || 'Failed to load payment methods. Please try again.');
            setPaymentMethods([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch subscription overview from API
    const fetchSubscriptionOverview = useCallback(async () => {
        try {
            const token = getAccessToken();
            const url = `${API_BASE_URL}/user/firm-admin/subscription/overview/`;

            const response = await fetchWithCors(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                const data = result.data;

                // Check if subscription is scheduled for cancellation (stripe usually sends cancel_at_period_end)
                // If so, override status to 'cancelled' for UI display purposes
                if (data.overview && data.overview.plan) {
                    if (data.overview.plan.cancel_at_period_end === true ||
                        data.overview.plan.is_cancelled === true ||
                        data.overview.plan.status === 'cancelled') {
                        data.overview.plan.status = 'canceled';
                    }
                }

                setSubscriptionOverview(data);

                // Extract current plan name from overview
                if (data.overview && data.overview.plan) {
                    setCurrentPlan(data.overview.plan.name);
                }
                // Set automatic payment failover status
                if (data.overview && data.overview.automatic_payment_failover !== undefined) {
                    setIsFailoverEnabled(data.overview.automatic_payment_failover);
                }
            }
        } catch (err) {
            console.error('Error fetching subscription overview:', err);
            // Don't set error state here as it's not critical for the page to function
        }
    }, []);

    // Fetch subscription overview on mount
    useEffect(() => {
        fetchSubscriptionOverview();
    }, [fetchSubscriptionOverview]);

    // Handle subscription success redirect from Stripe
    useEffect(() => {
        const subscriptionSuccess = searchParams.get('subscription_success');
        const subscriptionCancelled = searchParams.get('subscription_cancelled');

        if (subscriptionSuccess === 'true') {
            // Show success message
            toast.success('Subscription activated successfully!', {
                position: 'top-right',
                autoClose: 5000,
            });

            // Refresh user data to get updated subscription info
            const storage = getStorage();
            const token = getAccessToken();
            if (token) {
                fetchWithCors(`${API_BASE_URL}/user/me/`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                })
                    .then(response => response.json())
                    .then(result => {
                        if (result.success && result.data) {
                            const userData = result.data;
                            storage.setItem("userData", JSON.stringify(userData));
                            sessionStorage.setItem("userData", JSON.stringify(userData));
                            // Remove the query parameter
                            setSearchParams({});
                            // Refresh subscription overview to show updated subscription
                            fetchSubscriptionOverview();
                        }
                    })
                    .catch(err => {
                        console.error('Error fetching user data:', err);
                        setSearchParams({});
                    });
            } else {
                setSearchParams({});
            }
        } else if (subscriptionCancelled === 'true') {
            toast.info('Subscription change was cancelled.', {
                position: 'top-right',
                autoClose: 3000,
            });
            setSearchParams({});
        }
    }, [searchParams, setSearchParams, fetchSubscriptionOverview]);

    // Fetch payment methods on mount
    useEffect(() => {
        if (activeTab === 'Overview') {
            fetchPaymentMethods();
        }
    }, [activeTab, fetchPaymentMethods]);

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' });
        } catch {
            return dateString;
        }
    };

    // Format expiry date from YYYY-MM-DD to MM/YY
    const formatExpiryDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = String(date.getFullYear()).slice(-2);
            return `${month}/${year}`;
        } catch {
            return dateString;
        }
    };

    // Validation functions
    const validateCardNumber = (cardNumber) => {
        const cleanNumber = cardNumber.replace(/\s/g, '');
        if (!cleanNumber) return 'Card number is required';
        if (!/^\d+$/.test(cleanNumber)) return 'Card number must contain only digits';
        if (cleanNumber.length < 13 || cleanNumber.length > 19) {
            return 'Card number must be between 13 and 19 digits';
        }
        return '';
    };

    const validateExpiryDate = (expiryDate) => {
        if (!expiryDate) return 'Expiry date is required';
        const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
        if (!regex.test(expiryDate)) {
            return 'Invalid date format. Use MM/YY format (e.g., 12/25)';
        }

        // Check if the date is not in the past
        const [month, year] = expiryDate.split('/');
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;

        const expiryYear = parseInt(year) + 2000;
        const expiryMonth = parseInt(month);

        if (expiryYear < currentDate.getFullYear() ||
            (expiryYear === currentDate.getFullYear() && expiryMonth < currentMonth)) {
            return 'Card has expired';
        }

        return '';
    };

    const validateCardholderName = (name) => {
        if (!name.trim()) return 'Cardholder name is required';
        if (name.trim().length < 2) return 'Cardholder name must be at least 2 characters';
        return '';
    };

    const validateCVV = (cvv) => {
        if (!cvv) return 'CVV is required';
        if (!/^\d+$/.test(cvv)) return 'CVV must contain only digits';
        if (cvv.length < 3 || cvv.length > 4) return 'CVV must be 3 or 4 digits';
        return '';
    };

    const validateForm = () => {
        const errors = {
            cardNumber: validateCardNumber(newPaymentMethod.cardNumber),
            cardholderName: validateCardholderName(newPaymentMethod.cardholderName),
            expiryDate: validateExpiryDate(newPaymentMethod.expiryDate),
            cvv: validateCVV(newPaymentMethod.cvv)
        };

        setFormErrors(errors);
        return Object.values(errors).every(error => error === '');
    };

    // Handle add payment method button click
    const handleAddPaymentMethod = () => {
        // Reset form and errors when opening modal
        setNewPaymentMethod({
            cardNumber: '',
            cardholderName: '',
            expiryDate: '',
            cvv: '',
            isDefault: false
        });
        setFormErrors({
            cardNumber: '',
            cardholderName: '',
            expiryDate: '',
            cvv: ''
        });
        setError('');
        setShowAddModal(true);
    };

    // Handle save payment method
    const handleSavePaymentMethod = async () => {
        try {
            setSaving(true);
            setError('');

            // Validate form before submitting
            if (!validateForm()) {
                setSaving(false);
                return;
            }

            // Prepare the payment method data for the API
            const paymentMethodData = {
                card_number: newPaymentMethod.cardNumber.replace(/\s/g, ''),
                cardholder_name: newPaymentMethod.cardholderName,
                expiry_date: newPaymentMethod.expiryDate, // Format: MM/YY
                cvv: newPaymentMethod.cvv,
                is_primary: newPaymentMethod.isDefault
            };

            const token = getAccessToken();
            const url = `${API_BASE_URL}/user/firm-admin/payment-methods/`;

            const response = await fetchWithCors(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(paymentMethodData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Handle the response structure from your API
            if (result.success || result.id) {
                // Refresh the payment methods list
                await fetchPaymentMethods();

                // Reset form
                setNewPaymentMethod({
                    cardNumber: '',
                    cardholderName: '',
                    expiryDate: '',
                    cvv: '',
                    isDefault: false
                });

                setShowAddModal(false);
            } else {
                setError('Failed to add payment method');
            }
        } catch (err) {
            console.error('Error adding payment method:', err);
            const errorMsg = handleAPIError(err);
            setError(errorMsg || 'Failed to add payment method. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Handle delete payment method
    const handleDeletePaymentMethod = async (paymentId) => {
        setPaymentMethodToDelete(paymentId);
        setShowDeletePaymentConfirm(true);
    };

    const confirmDeletePaymentMethod = async () => {
        if (!paymentMethodToDelete) return;

        try {
            const response = await firmAdminPaymentMethodsAPI.deletePaymentMethod(paymentMethodToDelete);

            if (response.success) {
                toast.success(response.message || 'Payment method deleted successfully', {
                    position: 'top-right',
                    autoClose: 3000,
                    pauseOnHover: false
                });
                // Refresh the payment methods list
                await fetchPaymentMethods();
            } else {
                // Handle specific error cases
                let errorMessage = response.message || 'Failed to delete payment method';

                if (errorMessage.includes('primary payment method')) {
                    errorMessage = 'Cannot delete primary payment method. Set another payment method as primary first.';
                } else if (errorMessage.includes('last payment method')) {
                    errorMessage = 'Cannot delete the last payment method. Please add another payment method first.';
                } else if (errorMessage.includes('not found')) {
                    errorMessage = 'Payment method not found.';
                }

                toast.error(errorMessage, {
                    position: 'top-right',
                    autoClose: 5000,
                    pauseOnHover: false
                });
            }
        } catch (err) {
            console.error('Error deleting payment method:', err);
            const errorMsg = handleAPIError(err);
            toast.error(errorMsg || 'Failed to delete payment method. Please try again.', {
                position: 'top-right',
                autoClose: 3000,
                pauseOnHover: false
            });
        } finally {
            setDeletingPaymentMethod(false);
        }
    };

    // Handle set payment method as primary
    const handleSetDefaultPaymentMethod = async (paymentId) => {
        try {
            const response = await firmAdminPaymentMethodsAPI.updatePaymentMethodPrimary(paymentId);
            if (response.success) {
                toast.success('Payment method set as default successfully');
                // Refresh both to ensure visual consistency
                await fetchPaymentMethods();
                await fetchSubscriptionOverview();
            } else {
                toast.error(response.message || 'Failed to set payment method as default');
            }
        } catch (err) {
            console.error('Error setting default payment method:', err);
            const errorMsg = handleAPIError(err);
            toast.error(errorMsg || 'Failed to set payment method as default');
        }
    };

    // Show cancel confirmation modal
    const handleCancelSubscriptionClick = () => {
        setShowCancelConfirmModal(true);
    };

    // Handle cancel subscription (after confirmation)
    const handleCancelSubscription = async () => {
        // Get subscription type from current plan
        const planName = subscriptionOverview?.overview?.plan?.name || currentPlan || '';

        // Map plan names to subscription types (case-insensitive)
        const planToSubscriptionType = {
            'solo': 'solo',
            'professional': 'professional',
            'enterprise': 'enterprise',
            'business': 'business',
            'starter': 'starter',
            'basic': 'basic',
            'premium': 'premium'
        };

        // Determine subscription type (default to 'professional' if not found)
        const subscriptionType = planToSubscriptionType[planName.toLowerCase()] || 'professional';

        // Close confirmation modal
        setShowCancelConfirmModal(false);

        try {
            setCancellingSubscription(true);
            const response = await firmAdminSubscriptionAPI.cancelSubscription(subscriptionType);

            if (response.success) {
                const data = response.data || {};
                let message = response.message || 'Subscription cancelled successfully';

                // Provide more detailed message based on cancellation type
                if (data.cancelled_immediately === true) {
                    message = 'Your subscription has been cancelled immediately. Access will be revoked shortly.';
                } else if (data.cancelled_immediately === false) {
                    message = 'Your subscription has been scheduled for cancellation at the end of the current billing period. You will continue to have access until then.';

                    // Add subscription end date if available
                    if (data.subscription_end_date) {
                        const endDate = new Date(data.subscription_end_date);
                        const formattedDate = endDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        message += ` Your subscription will end on ${formattedDate}.`;
                    }
                }

                toast.success(message, {
                    position: 'top-right',
                    autoClose: 7000,
                    pauseOnHover: true
                });

                // Refresh subscription overview to reflect the cancellation
                await fetchSubscriptionOverview();

                // Manually update status to 'canceled' in case the API still returns 'active' (e.g. grace period)
                // This ensures the UI reflects the user's action immediately.
                setSubscriptionOverview(prev => {
                    if (!prev || !prev.overview || !prev.overview.plan) return prev;
                    return {
                        ...prev,
                        overview: {
                            ...prev.overview,
                            plan: {
                                ...prev.overview.plan,
                                status: 'canceled'
                            }
                        }
                    };
                });
            } else {
                throw new Error(response.message || 'Failed to cancel subscription');
            }
        } catch (err) {
            console.error('Error cancelling subscription:', err);
            const errorMsg = handleAPIError(err);
            toast.error(errorMsg || 'Failed to cancel subscription. Please try again.', {
                position: 'top-right',
                autoClose: 5000,
                pauseOnHover: false
            });
        } finally {
            setCancellingSubscription(false);
        }
    };

    // Format payment method data for display
    const formatPaymentMethod = (method) => {
        const isPrimary = method.is_primary || method.isPrimary || false;

        // Extract card brand from card number (first digit determines brand)
        let title = 'Payment Method';
        if (method.card_number) {
            const firstDigit = method.card_number.replace(/\*/g, '').charAt(0) || method.card_number.charAt(0);
            if (firstDigit === '4') {
                title = 'Visa';
            } else if (firstDigit === '5') {
                title = 'Mastercard';
            } else if (firstDigit === '3') {
                title = 'American Express';
            } else {
                title = 'Credit Card';
            }
        }

        const subtitle = 'Credit Card';

        // Use card_number directly from API (already masked like "************3123")
        // Format it with spaces for better readability: "**** **** **** 3123"
        let number = method.card_number || 'N/A';
        if (number && number !== 'N/A') {
            // Extract last 4 digits from masked number
            const digits = number.replace(/\*/g, '');
            if (digits.length >= 4) {
                const last4 = digits.slice(-4);
                number = `**** **** **** ${last4}`;
            } else if (number.includes('*')) {
                // If format is different, try to extract visible digits
                const visibleDigits = number.match(/\d+/g);
                if (visibleDigits && visibleDigits.length > 0) {
                    const last4 = visibleDigits.join('').slice(-4);
                    number = `**** **** **** ${last4}`;
                } else {
                    // Fallback: format with spaces
                    number = number.replace(/(.{4})/g, '$1 ').trim();
                }
            }
        }

        // Format expiry_date from YYYY-MM-DD to MM/YY
        const expires = method.expiry_date ? formatExpiryDate(method.expiry_date) : '';

        // Cardholder name
        const cardholderName = method.cardholder_name || 'N/A';

        return {
            id: method.id,
            title,
            subtitle,
            number,
            expires,
            cardholderName,
            isPrimary,
            type: 'credit_card'
        };
    };


    return (
        <div className="min-h-screen bg-[#F3F7FF] lg:p-4 sm:p-2">
            <div className="mx-auto">
                {/* Developer Subscription Banner */}
                {isDeveloperSubscription && (
                    <div className="mb-6 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-6 flex items-center gap-5 shadow-sm">
                        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 16H13V18H11V16ZM11 6H13V14H11V6Z" fill="currentColor" />
                            </svg>
                        </div>
                        <div>
                            <h5 className="text-xl font-bold text-blue-900 font-[BasisGrotesquePro]">Full Platform Access Activated</h5>
                            <p className="text-[#3B4A66] font-[BasisGrotesquePro] max-w-2xl">
                                Your account is currently authorized under a <strong>Developer Subscription</strong>.
                                This grants you unrestricted access to all premium features and resource limits for internal QA and validation testing.
                                No billing actions are required while this mode is active.
                            </p>
                        </div>
                        <div className="ml-auto hidden md:block">
                            <span className="px-4 py-2 bg-blue-600 text-white !rounded-full text-xs font-bold uppercase tracking-widest">
                                Developer Mode
                            </span>
                        </div>
                    </div>
                )}

                {/* Header Section */}

                <div className="mb-6 sm:mb-10">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-5 mb-8">
                        <div>
                            <h4 className="text-2xl sm:text-3xl font-bold text-[#1F2A55] mb-1 font-[BasisGrotesquePro]">Subscription Management</h4>
                            <p className="text-sm sm:text-base text-gray-500 font-[BasisGrotesquePro]">Manage your enterprise plan, resource usage, and billing</p>
                        </div>
                        <button
                            onClick={() => setIsUpgradePlanModalOpen(true)}
                            className="w-full sm:w-auto px-6 py-3 bg-[#F56D2D] text-white !rounded-xl hover:bg-[#EA580C] transition-all shadow-md shadow-[#F56D2D]/20 flex items-center justify-center gap-2 font-bold text-sm sm:text-base whitespace-nowrap"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            {currentPlan ? 'Modify Subscription' : 'Upgrade Plan'}
                        </button>
                    </div>

                    {/* Navigation Tabs - Optimized for Mobile Swipe */}
                    <div className="overflow-x-auto custom-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0 scroll-smooth">
                        <div className="bg-[#F8FAFF] !rounded-xl !border border-[#E8F0FF] p-1.5 flex gap-1.5 sm:gap-2 w-fit min-w-full sm:min-w-0">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 sm:px-6 !rounded-lg font-[BasisGrotesquePro] text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${activeTab === tab
                                        ? 'bg-[#3AD6F2] text-white shadow-md shadow-[#3AD6F2]/20'
                                        : 'bg-transparent text-[#6B7280] hover:text-[#3B4A66] hover:bg-white/50'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* All Plan Tab Content */}
                {activeTab === 'All Plan' && <AllPlans
                    currentPlanName={currentPlan}
                    currentBillingCycle={subscriptionOverview?.overview?.plan?.billing_cycle}
                />}

                {/* Add-ons Tab Content */}
                {activeTab === 'Add-ons' && <AddOns />}

                {/* Billing Tab Content */}
                {activeTab === 'Billing' && <BillingEnhanced />}

                {/* Admin Tab Content */}
                {activeTab === 'Admin' && <AdminControls />}

                {/* Security Tab Content */}
                {activeTab === 'Security' && <Security />}

                {/* Automation Tab Content */}
                {activeTab === 'Automation' && <Automation />}

                {/* Plan Details and Usage Overview - Show only for Overview tab */}
                {activeTab === 'Overview' && (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
                            {/* Plan Card */}
                            <div className="bg-white !rounded-xl !border border-[#E8F0FF] p-5 sm:p-8 relative shadow-sm overflow-hidden flex flex-col">
                                {/* Premium Background Accent */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F3F7FF] rounded-bl-full -mr-16 -mt-16 opacity-50 z-0"></div>

                                <div className="relative z-10 flex-1">
                                    {subscriptionOverview?.overview?.plan ? (
                                        <>
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        <h5 className="text-xl sm:text-2xl font-bold text-[#1F2A55] font-[BasisGrotesquePro]">
                                                            {subscriptionOverview.overview.plan.name || 'Current Plan'}
                                                        </h5>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-3 py-1 !rounded-full text-[10px] font-bold font-[BasisGrotesquePro] uppercase tracking-wider ${subscriptionOverview.overview.plan.status === 'active'
                                                                ? 'bg-green-50 text-green-600 border border-green-100'
                                                                : 'bg-red-50 text-red-600 border border-red-100'
                                                                }`}>
                                                                {subscriptionOverview.overview.plan.status || 'Active'}
                                                            </span>
                                                            {subscriptionOverview.overview.plan.billing_cycle && (
                                                                <span className="px-3 py-1 !rounded-full text-[10px] font-bold font-[BasisGrotesquePro] uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                                    {subscriptionOverview.overview.plan.billing_cycle}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-baseline gap-1">
                                                        <p className="text-3xl sm:text-4xl font-bold text-[#F56D2D] font-[BasisGrotesquePro]">
                                                            ${subscriptionOverview.overview.plan.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                                        </p>
                                                        <span className="text-sm font-medium text-gray-400 font-[BasisGrotesquePro]">
                                                            /{subscriptionOverview.overview.plan.billing_cycle === 'yearly' ? 'year' : 'month'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-left sm:text-right">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                                                        {subscriptionOverview.overview.plan.expiry_date ? (subscriptionOverview.overview.plan.status === 'active' ? 'Next Billing' : 'Expires On') : 'Status'}
                                                    </p>
                                                    <p className={`text-sm font-bold font-[BasisGrotesquePro] ${!subscriptionOverview.overview.plan.expiry_date ? 'text-red-500' : 'text-[#3B4A66]'}`}>
                                                        {subscriptionOverview.overview.plan.expiry_date
                                                            ? new Date(subscriptionOverview.overview.plan.expiry_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                                            : 'Not Available'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mb-8 p-4 sm:p-5 bg-[#F8FAFF] !rounded-xl border border-[#E8F0FF]">
                                                <h6 className="text-sm font-bold text-[#1F2A55] mb-4 font-[BasisGrotesquePro] flex items-center gap-2">
                                                    <div className="p-1 bg-[#F56D2D]/10 rounded-md">
                                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                                            <path d="M14 4L6.66667 11.3333L3 7.66667" stroke="#F56D2D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    </div>
                                                    Plan Privileges
                                                </h6>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-x-4 gap-y-3">
                                                    {subscriptionOverview.overview.plan.features &&
                                                        subscriptionOverview.overview.plan.features.length > 0 ? (
                                                        subscriptionOverview.overview.plan.features.map((feature, index) => (
                                                            <div key={index} className="flex items-center gap-2.5">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-[#3AD6F2]"></div>
                                                                <span className="text-xs text-[#3B4A66] font-medium font-[BasisGrotesquePro] leading-tight">{feature}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">Standard platform features included</p>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-20">
                                            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#F56D2D]/30 border-t-[#F56D2D]"></div>
                                            <p className="mt-4 text-sm text-gray-500 font-[BasisGrotesquePro]">Syncing plan details...</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100 mt-auto">
                                    {subscriptionOverview?.overview?.plan?.status !== 'canceled' && (
                                        <button
                                            onClick={() => setIsUpgradePlanModalOpen(true)}
                                            className="flex-1 px-6 py-3 bg-[#F56D2D] text-white !rounded-xl hover:bg-[#EA580C] transition-all shadow-md hover:shadow-lg font-bold text-sm font-[BasisGrotesquePro]"
                                        >
                                            Modify Subscription
                                        </button>
                                    )}
                                    <button
                                        onClick={handleCancelSubscriptionClick}
                                        disabled={cancellingSubscription || subscriptionOverview?.overview?.plan?.status === 'canceled'}
                                        className={`flex-1 px-6 py-3 bg-white border border-red-100 text-red-500 !rounded-xl hover:bg-red-50 hover:border-red-200 transition-all font-bold text-sm font-[BasisGrotesquePro] disabled:opacity-50 ${subscriptionOverview?.overview?.plan?.status === 'canceled' ? 'w-full !text-gray-400 !border-gray-100' : ''}`}
                                    >
                                        {cancellingSubscription ? 'Processing...' : (subscriptionOverview?.overview?.plan?.status === 'canceled' ? 'Service Canceled' : 'Cancel Service')}
                                    </button>
                                </div>

                                {/* Additional Info Row */}
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                                        <div className={`w-2 h-2 rounded-full ${subscriptionOverview?.overview?.automatic_payment_failover ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight font-[BasisGrotesquePro]">Failover: {subscriptionOverview?.overview?.automatic_payment_failover ? 'Active' : 'Disabled'}</span>
                                    </div>
                                    <div
                                        className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => setActiveTab('Add-ons')}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6 2V10M2 6H10" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight font-[BasisGrotesquePro]">Add-ons: {subscriptionOverview?.overview?.addons?.count || 0} (${subscriptionOverview?.overview?.addons?.total_monthly_cost || 0}/mo)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Usage Overview Card */}
                            <div className="bg-white !rounded-xl !border border-[#E8F0FF] p-5 sm:p-8 relative shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h5 className="text-xl font-bold text-[#1F2A55] font-[BasisGrotesquePro]">Resource Usage</h5>
                                        <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">Real-time tracking of active limits</p>
                                    </div>
                                    <div className="p-2 sm:p-3 bg-[#F3F7FF] !rounded-xl border border-[#E8F0FF]">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-5 h-5 sm:w-6 sm:h-6">
                                            <path d="M12 20V10M18 20V4M6 20V16" stroke="#3AD6F2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>

                                {subscriptionOverview?.overview?.usage ? (
                                    <div className="space-y-6 sm:space-y-8">
                                        {/* Usage Bar Rendering */}
                                        <div className="space-y-6">
                                            {(() => {
                                                const isUnlimited = (val) => val === null || val === 'Unlimited' || val === 'unlimited';
                                                const renderUsageBar = (title, used, limit, colorClass = 'bg-[#3AD6F2]') => {
                                                    const unlimited = isUnlimited(limit);
                                                    const percentage = unlimited ? 0 : Math.min((used / limit) * 100, 100);

                                                    return (
                                                        <div>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-sm font-bold text-[#3B4A66] font-[BasisGrotesquePro]">{title}</span>
                                                                <span className="text-sm font-bold text-[#1F2A55] font-[BasisGrotesquePro]">
                                                                    {used} <span className="text-gray-300 font-medium">/ {unlimited ? '∞' : limit}</span>
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-[#F8FAFF] !rounded-full h-2 sm:h-2.5 overflow-hidden border border-[#E8F0FF]">
                                                                <div
                                                                    className={`${unlimited ? 'bg-gradient-to-r from-[#3AD6F2] to-[#BEEAF2]' : colorClass} h-full rounded-full transition-all duration-700 ease-out shadow-sm`}
                                                                    style={{ width: unlimited ? '100%' : `${percentage}%`, opacity: unlimited ? 0.4 : 1 }}
                                                                ></div>
                                                            </div>
                                                            {unlimited && <p className="text-[10px] text-gray-400 mt-1.5 font-medium italic font-[BasisGrotesquePro]">Unlimited capacity included</p>}
                                                        </div>
                                                    );
                                                };

                                                return (
                                                    <>
                                                        {renderUsageBar('Client Accounts', subscriptionOverview.overview.usage.clients.used, subscriptionOverview.overview.usage.clients.limit)}
                                                        {renderUsageBar('Staff Members', subscriptionOverview.overview.usage.staff_users.used, subscriptionOverview.overview.usage.staff_users.limit, 'bg-indigo-500')}
                                                        {renderUsageBar('Offices', subscriptionOverview.overview.usage.offices?.used || 0, subscriptionOverview.overview.usage.offices?.limit, 'bg-emerald-500')}
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-3 gap-4 pt-2">
                                            {/* Storage */}
                                            <div className="p-4 bg-[#F8FAFF] !rounded-xl border border-[#E8F0FF] flex flex-col justify-between hover:bg-white transition-colors group">
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 font-[BasisGrotesquePro] group-hover:text-[#3AD6F2] transition-colors">Cloud Storage</p>
                                                    <p className="text-lg font-bold text-[#1F2A55] font-[BasisGrotesquePro]">
                                                        {(() => {
                                                            const bytes = subscriptionOverview.overview.usage.storage_gb.used_bytes;
                                                            if (bytes !== undefined && bytes !== null) {
                                                                if (bytes === 0) return "0 KB";
                                                                const k = 1024;
                                                                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                                                                const i = Math.floor(Math.log(bytes) / Math.log(k));
                                                                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                                                            }
                                                            return subscriptionOverview.overview.usage.storage_gb.used + ' GB';
                                                        })()}
                                                    </p>
                                                </div>
                                                <div className="mt-4">
                                                    <div className="w-full bg-[#F3F7FF] h-1.5 !rounded-full overflow-hidden border border-[#E8F0FF]">
                                                        <div
                                                            className="bg-[#3AD6F2] h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${Math.min((subscriptionOverview.overview.usage.storage_gb.used / subscriptionOverview.overview.usage.storage_gb.limit) * 100, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 mt-1.5 font-bold font-[BasisGrotesquePro]">
                                                        OF {subscriptionOverview.overview.usage.storage_gb.limit} GB
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Workflows */}
                                            <div className="p-4 bg-[#F8FAFF] !rounded-xl border border-[#E8F0FF] flex flex-col justify-between hover:bg-white transition-colors group">
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 font-[BasisGrotesquePro] group-hover:text-green-500 transition-colors">Workflows</p>
                                                    <p className="text-lg font-bold text-[#1F2A55] font-[BasisGrotesquePro]">
                                                        {subscriptionOverview.overview.usage.workflows.used}
                                                        <span className="text-gray-300 font-medium text-sm ml-1">
                                                            / {(subscriptionOverview.overview.usage.workflows.limit === 'Unlimited' || subscriptionOverview.overview.usage.workflows.limit === null) ? '∞' : subscriptionOverview.overview.usage.workflows.limit}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="mt-4">
                                                    <div className="w-full bg-[#F3F7FF] h-1.5 !rounded-full overflow-hidden border border-[#E8F0FF]">
                                                        <div
                                                            className="bg-green-500 h-full rounded-full transition-all duration-500"
                                                            style={{
                                                                width: (subscriptionOverview.overview.usage.workflows.limit === 'Unlimited' || subscriptionOverview.overview.usage.workflows.limit === null)
                                                                    ? '100%'
                                                                    : `${Math.min((subscriptionOverview.overview.usage.workflows.used / subscriptionOverview.overview.usage.workflows.limit) * 100, 100)}%`,
                                                                opacity: (subscriptionOverview.overview.usage.workflows.limit === 'Unlimited' || subscriptionOverview.overview.usage.workflows.limit === null) ? 0.3 : 1
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 mt-1.5 font-bold font-[BasisGrotesquePro]">
                                                        {(subscriptionOverview.overview.usage.workflows.limit === 'Unlimited' || subscriptionOverview.overview.usage.workflows.limit === null) ? 'UNLIMITED' : 'MONTHLY QUOTA'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* E-Signatures */}
                                            <div className="p-4 bg-[#F8FAFF] !rounded-xl border border-[#E8F0FF] flex flex-col justify-between hover:bg-white transition-colors group">
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 font-[BasisGrotesquePro] group-hover:text-purple-500 transition-colors">E-Signatures</p>
                                                    <p className="text-lg font-bold text-[#1F2A55] font-[BasisGrotesquePro]">
                                                        {subscriptionOverview.overview.usage.esignatures?.used || 0}
                                                        <span className="text-gray-300 font-medium text-sm ml-1">
                                                            / {(subscriptionOverview.overview.usage.esignatures?.limit === 'Unlimited' || subscriptionOverview.overview.usage.esignatures?.limit === null) ? '∞' : (subscriptionOverview.overview.usage.esignatures?.limit || 0)}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="mt-4">
                                                    <div className="w-full bg-[#F3F7FF] h-1.5 !rounded-full overflow-hidden border border-[#E8F0FF]">
                                                        <div
                                                            className="bg-purple-500 h-full rounded-full transition-all duration-500"
                                                            style={{
                                                                width: (subscriptionOverview.overview.usage.esignatures?.limit === 'Unlimited' || subscriptionOverview.overview.usage.esignatures?.limit === null)
                                                                    ? '100%'
                                                                    : `${Math.min(((subscriptionOverview.overview.usage.esignatures?.used || 0) / (subscriptionOverview.overview.usage.esignatures?.limit || 1)) * 100, 100)}%`,
                                                                opacity: (subscriptionOverview.overview.usage.esignatures?.limit === 'Unlimited' || subscriptionOverview.overview.usage.esignatures?.limit === null) ? 0.3 : 1
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 mt-1.5 font-bold font-[BasisGrotesquePro]">
                                                        {(subscriptionOverview.overview.usage.esignatures?.limit === 'Unlimited' || subscriptionOverview.overview.usage.esignatures?.limit === null) ? 'UNLIMITED' : 'MONTHLY QUOTA'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-20">
                                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#3AD6F2]/30 border-t-[#3AD6F2]"></div>
                                        <p className="mt-4 text-sm text-gray-500 font-[BasisGrotesquePro]">Calculating usage metrics...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Methods Section */}
                        <div className="mt-8">
                            <SavedPaymentMethods />
                        </div>
                    </>
                )}

                {/* Upgrade Plan Modal */}
                <UpgradePlanModal
                    isOpen={isUpgradePlanModalOpen}
                    onClose={() => setIsUpgradePlanModalOpen(false)}
                    currentPlanName={currentPlan}
                />

                {/* Cancel Subscription Confirmation Modal */}
                {showCancelConfirmModal && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
                        onClick={() => {
                            if (!cancellingSubscription) {
                                setShowCancelConfirmModal(false);
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
                                <h3 className="text-xl font-bold font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                                    Cancel Subscription
                                </h3>
                                <button
                                    onClick={() => {
                                        if (!cancellingSubscription) {
                                            setShowCancelConfirmModal(false);
                                        }
                                    }}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                                    disabled={cancellingSubscription}
                                >
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M15 5L5 15M5 5L15 15" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                <p className="text-sm text-gray-700 font-[BasisGrotesquePro] mb-2">
                                    Are you sure you want to cancel your <span className="font-semibold">{subscriptionOverview?.overview?.plan?.name || currentPlan || 'subscription'}</span> subscription?
                                </p>
                                <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                                    This action cannot be undone. Your subscription will be cancelled and you may lose access to premium features.
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end gap-3 p-6 border-t border-[#E8F0FF]">
                                <button
                                    onClick={() => setShowCancelConfirmModal(false)}
                                    disabled={cancellingSubscription}
                                    className="px-6 py-2 bg-white border border-[#E8F0FF] text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ borderRadius: '8px' }}
                                >
                                    Keep Subscription
                                </button>
                                <button
                                    onClick={handleCancelSubscription}
                                    disabled={cancellingSubscription}
                                    className="px-6 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E66F2F] transition-colors font-[BasisGrotesquePro] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ borderRadius: '8px' }}
                                >
                                    {cancellingSubscription ? 'Cancelling...' : 'Yes, Cancel Subscription'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Payment Method Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showDeletePaymentConfirm}
                    onClose={() => {
                        if (!deletingPaymentMethod) {
                            setShowDeletePaymentConfirm(false);
                            setPaymentMethodToDelete(null);
                        }
                    }}
                    onConfirm={confirmDeletePaymentMethod}
                    title="Delete Payment Method"
                    message="Are you sure you want to delete this payment method?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    isLoading={deletingPaymentMethod}
                    isDestructive={true}
                />
            </div>
        </div>
    );
};

export default SubscriptionManagement;
