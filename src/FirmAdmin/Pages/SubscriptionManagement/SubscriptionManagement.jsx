import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken, getStorage } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError, firmAdminPaymentMethodsAPI, firmAdminSubscriptionAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import AllPlans from './AllPlans';
import AddOns from './AddOns';
import Billing from './Billing';
import AdminControls from './AdminControls';
import Security from './Security';
import Automation from './Automation';
import UpgradePlanModal from './UpgradePlanModal';
import ConfirmationModal from '../../../components/ConfirmationModal';
import './SubscriptionManagement.css';

const API_BASE_URL = getApiBaseUrl();

const SubscriptionManagement = () => {
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

            // Handle response structure
            if (result.success && result.data) {
                setSubscriptionOverview(result.data);
                // Extract current plan name from overview
                if (result.data.overview && result.data.overview.plan) {
                    setCurrentPlan(result.data.overview.plan.name);
                }
                // Set automatic payment failover status
                if (result.data.overview && result.data.overview.automatic_payment_failover !== undefined) {
                    setIsFailoverEnabled(result.data.overview.automatic_payment_failover);
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
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                        <div>
                            <h4 className="text-2xl font-bold text-gray-900 mb-1 font-[BasisGrotesquePro]">Subscription Management</h4>
                            <p className="text-gray-600 font-[BasisGrotesquePro]">Manage your plan, usage, and billing</p>
                        </div>
                        <button
                            onClick={() => setIsUpgradePlanModalOpen(true)}
                            className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#EA580C] transition-colors flex items-center gap-2 font-[BasisGrotesquePro] text-sm sm:text-base whitespace-nowrap"
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16.5 5.25L10.125 11.625L6.375 7.875L1.5 12.75" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 5.25H16.5V9.75" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>

                            Upgrade Plan
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="mb-6">
                        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-1.5 sm:p-2 w-fit subscription-tabs-wrapper">
                            <div className="flex gap-2 sm:gap-3 overflow-x-auto subscription-tabs-scroll">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-[BasisGrotesquePro] transition-colors !rounded-lg whitespace-nowrap subscription-tab-btn ${activeTab === tab
                                            ? 'bg-[#3AD6F2] !text-white font-semibold'
                                            : 'bg-transparent !text-black hover:bg-gray-50'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
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
                {activeTab === 'Billing' && <Billing />}

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
                            <div className="bg-white rounded-xl !border border-[#E8F0FF] p-6 sm:p-8 relative shadow-sm">
                                {subscriptionOverview?.overview?.plan ? (
                                    <>
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h5 className="text-xl sm:text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                                                        {subscriptionOverview.overview.plan.name || 'Current'} Plan
                                                    </h5>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold font-[BasisGrotesquePro] uppercase tracking-wider ${subscriptionOverview.overview.plan.status === 'active'
                                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                                        : 'bg-red-100 text-red-700 border border-red-200'
                                                        }`}>
                                                        {subscriptionOverview.overview.plan.status || 'Active'}
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-bold text-[#F56D2D] font-[BasisGrotesquePro]">
                                                    ${subscriptionOverview.overview.plan.current_price?.toFixed(2) || '0.00'}
                                                    <span className="text-sm font-normal text-gray-500 ml-1">
                                                        /{subscriptionOverview.overview.plan.billing_cycle || 'month'}
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400 font-[BasisGrotesquePro] uppercase tracking-tighter mb-1">
                                                    {subscriptionOverview.overview.plan.expiry_date ? 'Renews On' : 'Status'}
                                                </p>
                                                <p className={`text-sm font-bold font-[BasisGrotesquePro] ${!subscriptionOverview.overview.plan.expiry_date ? 'text-red-500' : 'text-gray-700'}`}>
                                                    {subscriptionOverview.overview.plan.expiry_date
                                                        ? new Date(subscriptionOverview.overview.plan.expiry_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                                        : 'Expired'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mb-8 p-4 bg-[#F8FAFF] rounded-xl border border-[#E8F0FF]">
                                            <h6 className="text-sm font-bold text-gray-900 mb-4 font-[BasisGrotesquePro] flex items-center gap-2">
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M14 4L6.66667 11.3333L3 7.66667" stroke="#F56D2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Plan Features
                                            </h6>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                                {subscriptionOverview.overview.plan.features &&
                                                    subscriptionOverview.overview.plan.features.length > 0 ? (
                                                    subscriptionOverview.overview.plan.features.map((feature, index) => (
                                                        <div key={index} className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#3AD6F2]"></div>
                                                            <span className="text-xs sm:text-sm text-gray-700 font-[BasisGrotesquePro]">{feature}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">Standard features included</p>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#F56D2D]"></div>
                                        <p className="mt-4 text-sm text-gray-600">Syncing plan details...</p>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => setIsUpgradePlanModalOpen(true)}
                                        className="flex-1 px-4 py-2.5 bg-[#F56D2D] text-white rounded-lg hover:bg-[#EA580C] transition-all shadow-sm hover:shadow-md font-bold text-sm"
                                    >
                                        Manage Subscription
                                    </button>
                                    <button
                                        onClick={handleCancelSubscriptionClick}
                                        disabled={cancellingSubscription}
                                        className="px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all font-bold text-sm disabled:opacity-50"
                                    >
                                        {cancellingSubscription ? 'Processing...' : 'Cancel Plan'}
                                    </button>
                                </div>
                            </div>

                            {/* Usage Overview Card */}
                            <div className="bg-white rounded-xl !border border-[#E8F0FF] p-6 sm:p-8 relative shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h5 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">Usage Overview</h5>
                                        <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">Current consumption vs limits</p>
                                    </div>
                                    <div className="p-2 bg-[#F3F7FF] rounded-lg">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 20V10" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M18 20V4" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M6 20V16" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>

                                {subscriptionOverview?.overview?.usage ? (
                                    <div className="space-y-6">
                                        {/* Clients */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">Active Clients</span>
                                                </div>
                                                <span className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">
                                                    {subscriptionOverview.overview.usage.clients.used}
                                                    <span className="text-gray-400 font-normal">/{subscriptionOverview.overview.usage.clients.limit}</span>
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="bg-[#3AD6F2] h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${Math.min((subscriptionOverview.overview.usage.clients.used / subscriptionOverview.overview.usage.clients.limit) * 100, 100)}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Staff Users */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">Staff Seats</span>
                                                <span className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">
                                                    {subscriptionOverview.overview.usage.staff_users.used}
                                                    <span className="text-gray-400 font-normal">/
                                                        {['Unlimited', 'unlimited'].includes(subscriptionOverview.overview.usage.staff_users.limit) ? '∞' : subscriptionOverview.overview.usage.staff_users.limit}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${['Unlimited', 'unlimited'].includes(subscriptionOverview.overview.usage.staff_users.limit) ? 'bg-green-400' : 'bg-[#3AD6F2]'}`}
                                                    style={{
                                                        width: ['Unlimited', 'unlimited'].includes(subscriptionOverview.overview.usage.staff_users.limit) ? '100%' : `${Math.min((subscriptionOverview.overview.usage.staff_users.used / subscriptionOverview.overview.usage.staff_users.limit) * 100, 100)}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Storage */}
                                            <div className="p-4 bg-[#F8FAFF] rounded-xl border border-[#E8F0FF]">
                                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Storage</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    {subscriptionOverview.overview.usage.storage_gb.used}
                                                    <span className="text-sm text-gray-400 font-normal ml-1">GB Used</span>
                                                </p>
                                                <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2">
                                                    <div className="bg-[#3AD6F2] h-full rounded-full" style={{ width: `${Math.min((subscriptionOverview.overview.usage.storage_gb.used / subscriptionOverview.overview.usage.storage_gb.limit) * 100, 100)}%` }}></div>
                                                </div>
                                            </div>

                                            {/* Workflows */}
                                            <div className="p-4 bg-[#F8FAFF] rounded-xl border border-[#E8F0FF]">
                                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Workflows</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    {subscriptionOverview.overview.usage.workflows.used}
                                                    <span className="text-sm text-gray-400 font-normal ml-1">Active</span>
                                                </p>
                                                <div className="w-full bg-green-200 h-1.5 rounded-full mt-2">
                                                    <div className="bg-green-500 h-full rounded-full" style={{ width: '100%' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#3AD6F2]"></div>
                                        <p className="mt-4 text-sm text-gray-600">Calculating usage...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Methods Section */}

                    </>
                )}


            </div>

            {/* Upgrade Plan Modal */}
            <UpgradePlanModal
                isOpen={isUpgradePlanModalOpen}
                onClose={() => setIsUpgradePlanModalOpen(false)}
                currentPlanName={currentPlan}
            />

            {/* Cancel Subscription Confirmation Modal */}
            {
                showCancelConfirmModal && (
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
                                <h2 className="text-xl font-bold font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                                    Cancel Subscription
                                </h2>
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
                                >
                                    Keep Subscription
                                </button>
                                <button
                                    onClick={handleCancelSubscription}
                                    disabled={cancellingSubscription}
                                    className="px-6 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E66F2F] transition-colors font-[BasisGrotesquePro] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {cancellingSubscription ? 'Cancelling...' : 'Yes, Cancel Subscription'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

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
    );
};

export default SubscriptionManagement;
