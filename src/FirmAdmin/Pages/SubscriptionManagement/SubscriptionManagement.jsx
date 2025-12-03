import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError, firmAdminPaymentMethodsAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import AllPlans from './AllPlans';
import AddOns from './AddOns';
import Billing from './Billing';
import AdminControls from './AdminControls';
import Security from './Security';
import Automation from './Automation';
import EnterpriseOverview from './Enterprise/EnterpriseOverview';
import EnterpriseOfficeManagement from './Enterprise/EnterpriseOfficeManagement';
import EnterpriseConsolidatedBilling from './Enterprise/EnterpriseConsolidatedBilling';
import EnterpriseCostAllocation from './Enterprise/EnterpriseCostAllocation';
import EnterpriseContracts from './Enterprise/EnterpriseContracts';
import UpgradePlanModal from './UpgradePlanModal';

const API_BASE_URL = getApiBaseUrl();

const SubscriptionManagement = () => {
    const [activeTab, setActiveTab] = useState('Overview');
    const [isFailoverEnabled, setIsFailoverEnabled] = useState(true);
    const [activeEnterpriseTab, setActiveEnterpriseTab] = useState('Overview');
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [subscriptionOverview, setSubscriptionOverview] = useState(null);
    const [isUpgradePlanModalOpen, setIsUpgradePlanModalOpen] = useState(false);

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

    const tabs = ['Overview', 'All Plan', 'Add-ons', 'Billing', 'Admin', 'Security', 'Automation', 'Enterprise'];
    const enterpriseTabs = [
        'Overview',
        'Office Management',
        'Consolidated Billing',
        'Cost Allocation Rules',
        'Enterprise Contracts',
    ];

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
        if (!window.confirm('Are you sure you want to delete this payment method?')) {
            return;
        }

        try {
            const response = await firmAdminPaymentMethodsAPI.deletePaymentMethod(paymentId);

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

    const renderEnterpriseTab = () => {
        switch (activeEnterpriseTab) {
            case 'Overview':
                return <EnterpriseOverview />;
            case 'Office Management':
                return <EnterpriseOfficeManagement />;
            case 'Consolidated Billing':
                return <EnterpriseConsolidatedBilling />;
            case 'Cost Allocation Rules':
                return <EnterpriseCostAllocation />;
            case 'Enterprise Contracts':
                return <EnterpriseContracts />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F7FF] p-4 sm:p-6">
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
                        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-1.5 sm:p-2 w-fit">
                            <div className="flex gap-2 sm:gap-3 overflow-x-auto">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-[BasisGrotesquePro] transition-colors !rounded-lg whitespace-nowrap ${activeTab === tab
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
                {activeTab === 'All Plan' && <AllPlans currentPlanName={currentPlan} />}

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
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                            {/* Plan Card */}
                            <div className="bg-white rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 relative">
                                {subscriptionOverview?.overview?.plan ? (
                                    <>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h5 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 font-[BasisGrotesquePro]">
                                                    {subscriptionOverview.overview.plan.name || 'Plan'} Plan
                                                </h5>
                                                <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                                                    ${subscriptionOverview.overview.plan.monthly_price?.toFixed(2) || '0.00'} per month
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium font-[BasisGrotesquePro] ${
                                                subscriptionOverview.overview.plan.status === 'active' 
                                                    ? 'bg-[#22C55E] text-white' 
                                                    : 'bg-gray-400 text-white'
                                            }`}>
                                                {subscriptionOverview.overview.plan.status ? 
                                                    subscriptionOverview.overview.plan.status.charAt(0).toUpperCase() + 
                                                    subscriptionOverview.overview.plan.status.slice(1) 
                                                    : 'Active'}
                                            </span>
                                        </div>

                                        <div className="mb-6">
                                            <h6 className="text-sm font-semibold text-gray-900 mb-3 font-[BasisGrotesquePro]">Plan Features</h6>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {subscriptionOverview.overview.plan.features && 
                                                 subscriptionOverview.overview.plan.features.length > 0 ? (
                                                    subscriptionOverview.overview.plan.features.map((feature, index) => (
                                                        <div key={index} className="flex items-center gap-2">
                                                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">{feature}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">No features listed</p>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <p className="mt-4 text-sm text-gray-600">Loading plan details...</p>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button className="px-4 sm:px-5 py-2 bg-white !border border-[#E8F0FF] text-gray-700 !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-sm font-medium">
                                        Change Plan
                                    </button>
                                    <button className="px-4 sm:px-5 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E66F2F] transition-colors font-[BasisGrotesquePro] text-sm font-medium">
                                        Cancel Subscription
                                    </button>
                                </div>
                            </div>

                            {/* Usage Overview Card */}
                            <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 relative">
                                <h5 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 font-[BasisGrotesquePro]">Usage Overview</h5>
                                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Current usage vs limits</p>

                                {subscriptionOverview?.overview?.usage ? (
                                    <div className="space-y-4">
                                        {/* Clients */}
                                        {subscriptionOverview.overview.usage.clients && (
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Clients</span>
                                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                                                        {subscriptionOverview.overview.usage.clients.used}/{subscriptionOverview.overview.usage.clients.limit}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-[#3AD6F2] h-2 rounded-full" 
                                                        style={{ 
                                                            width: `${Math.min(
                                                                (subscriptionOverview.overview.usage.clients.used / subscriptionOverview.overview.usage.clients.limit) * 100, 
                                                                100
                                                            )}%` 
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Staff Users */}
                                        {subscriptionOverview.overview.usage.staff_users && (
                                            <div>
                                                <div className="flex justify-between items-center mb-1 mt-6">
                                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Staff Users</span>
                                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                                                        {subscriptionOverview.overview.usage.staff_users.used}/
                                                        {subscriptionOverview.overview.usage.staff_users.limit === 'Unlimited' || 
                                                         subscriptionOverview.overview.usage.staff_users.limit === 'unlimited' 
                                                            ? 'Unlimited' 
                                                            : subscriptionOverview.overview.usage.staff_users.limit}
                                                    </span>
                                                </div>
                                                {subscriptionOverview.overview.usage.staff_users.limit !== 'Unlimited' && 
                                                 subscriptionOverview.overview.usage.staff_users.limit !== 'unlimited' ? (
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-[#3AD6F2] h-2 rounded-full" 
                                                            style={{ 
                                                                width: `${Math.min(
                                                                    (subscriptionOverview.overview.usage.staff_users.used / subscriptionOverview.overview.usage.staff_users.limit) * 100, 
                                                                    100
                                                                )}%` 
                                                            }}
                                                        ></div>
                                                    </div>
                                                ) : (
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div className="bg-[#3AD6F2] h-2 rounded-full" style={{ width: '100%' }}></div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Storage */}
                                        {subscriptionOverview.overview.usage.storage_gb && (
                                            <div>
                                                <div className="flex justify-between items-center mb-1 mt-6">
                                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Storage (GB)</span>
                                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                                                        {subscriptionOverview.overview.usage.storage_gb.used}/{subscriptionOverview.overview.usage.storage_gb.limit}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-[#3AD6F2] h-2 rounded-full" 
                                                        style={{ 
                                                            width: `${Math.min(
                                                                (subscriptionOverview.overview.usage.storage_gb.used / subscriptionOverview.overview.usage.storage_gb.limit) * 100, 
                                                                100
                                                            )}%` 
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Workflows */}
                                        {subscriptionOverview.overview.usage.workflows && (
                                            <div>
                                                <div className="flex justify-between items-center mb-1 mt-6">
                                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Workflows</span>
                                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                                                        {subscriptionOverview.overview.usage.workflows.used}/
                                                        {subscriptionOverview.overview.usage.workflows.limit === 'Unlimited' || 
                                                         subscriptionOverview.overview.usage.workflows.limit === 'unlimited' 
                                                            ? 'Unlimited' 
                                                            : subscriptionOverview.overview.usage.workflows.limit}
                                                    </span>
                                                </div>
                                                {subscriptionOverview.overview.usage.workflows.limit !== 'Unlimited' && 
                                                 subscriptionOverview.overview.usage.workflows.limit !== 'unlimited' ? (
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-[#3AD6F2] h-2 rounded-full" 
                                                            style={{ 
                                                                width: `${Math.min(
                                                                    (subscriptionOverview.overview.usage.workflows.used / subscriptionOverview.overview.usage.workflows.limit) * 100, 
                                                                    100
                                                                )}%` 
                                                            }}
                                                        ></div>
                                                    </div>
                                                ) : (
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div className="bg-[#3AD6F2] h-2 rounded-full" style={{ width: '100%' }}></div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <p className="mt-4 text-sm text-gray-600">Loading usage data...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Methods Section */}
                        <div className="mb-6 !bg-white rounded-lg p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                                <div>
                                    <h5 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 font-[BasisGrotesquePro]">Payment Methods</h5>
                                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Manage your billing payment methods with automatic failover</p>
                                </div>
                                <button
                                    onClick={handleAddPaymentMethod}
                                    className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors flex items-center gap-2 font-[BasisGrotesquePro] text-sm sm:text-base whitespace-nowrap"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add payment Method
                                </button>
                            </div>


                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Payment Method Cards */}
                            {loading ? (
                                <div className="text-center py-12 mb-6">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <p className="mt-4 text-sm text-gray-600">Loading payment methods...</p>
                                </div>
                            ) : paymentMethods.length === 0 ? (
                                <div className="text-center py-12 mb-6">
                                    <p className="text-sm text-gray-600">No payment methods found</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
                                    {paymentMethods.map((method) => {
                                        const formatted = formatPaymentMethod(method);
                                        const isCreditCard = formatted.type === 'credit_card' || formatted.type === 'card';
                                        const isBankAccount = formatted.type === 'bank_account' || formatted.type === 'ach';
                                        const isPayPal = formatted.type === 'paypal';

                                        return (
                                            <div key={formatted.id} className="!bg-white rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 relative shadow-sm">
                                                <button 
                                                    onClick={() => handleDeletePaymentMethod(method.id || formatted.id)}
                                                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors mt-3"
                                                    title="Delete payment method"
                                                >
                                                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <rect x="0.5" y="0.5" width="31" height="31" rx="6.5" fill="white" />
                                                        <rect x="0.5" y="0.5" width="31" height="31" rx="6.5" stroke="#E8F0FF" />
                                                        <path d="M9.25 11.5H22.75" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M21.25 11.5V22C21.25 22.75 20.5 23.5 19.75 23.5H12.25C11.5 23.5 10.75 22.75 10.75 22V11.5" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M13 11.5V10C13 9.25 13.75 8.5 14.5 8.5H17.5C18.25 8.5 19 9.25 19 10V11.5" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M14.5 15.25V19.75" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M17.5 15.25V19.75" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </button>
                                                <div className="flex items-start gap-3 mb-4 pr-8">
                                                    <div className="w-10 h-10 bg-[#E8F0FF] rounded-lg flex items-center justify-center flex-shrink-0">
                                                        {isCreditCard && (
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <rect width="24" height="24" rx="3" fill="#E8F0FF" />
                                                                <path d="M18 6.75H6C5.17157 6.75 4.5 7.42157 4.5 8.25V15.75C4.5 16.5784 5.17157 17.25 6 17.25H18C18.8284 17.25 19.5 16.5784 19.5 15.75V8.25C19.5 7.42157 18.8284 6.75 18 6.75Z" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M4.5 10.5H19.5" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        )}
                                                        {isBankAccount && (
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <rect width="24" height="24" rx="3" fill="#E8F0FF" />
                                                                <path d="M16.5 4.5H7.5C6.67157 4.5 6 5.17157 6 6V18C6 18.8284 6.67157 19.5 7.5 19.5H16.5C17.3284 19.5 18 18.8284 18 18V6C18 5.17157 17.3284 4.5 16.5 4.5Z" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M9.75 19.5V16.5H14.25V19.5" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M9 7.5H9.00583" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M15 7.5H15.0058" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M12 7.5H12.0058" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M12 10.5H12.0058" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M12 13.5H12.0058" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M15 10.5H15.0058" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M15 13.5H15.0058" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M9 10.5H9.00583" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M9 13.5H9.00583" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        )}
                                                        {isPayPal && (
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <rect width="24" height="24" rx="3" fill="#E8F0FF" />
                                                                <path d="M15.75 4.5H8.25C7.42157 4.5 6.75 5.17157 6.75 6V18C6.75 18.8284 7.42157 19.5 8.25 19.5H15.75C16.5784 19.5 17.25 18.8284 17.25 18V6C17.25 5.17157 16.5784 4.5 15.75 4.5Z" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M12 16.5H12.0075" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">{formatted.title}</p>
                                                            {formatted.isPrimary && (
                                                                <span className="px-2 py-0.5 bg-[#F56D2D] text-white rounded-full text-xs font-medium font-[BasisGrotesquePro] whitespace-nowrap flex items-center">
                                                                    Primary
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-0.5">{formatted.subtitle}</p>
                                                    </div>
                                                </div>
                                                <div className={isCreditCard ? "flex items-end justify-between gap-4" : "flex-1"}>
                                                    <div className="flex-1">
                                                        <p className="text-sm text-gray-900 font-[BasisGrotesquePro] m-0 leading-tight">{formatted.number}</p>
                                                        {formatted.cardholderName && (
                                                            <p className="text-xs text-gray-600 font-[BasisGrotesquePro] m-0 leading-tight mt-1">Cardholder: {formatted.cardholderName}</p>
                                                        )}
                                                        {formatted.expires && (
                                                            <p className="text-xs text-gray-600 font-[BasisGrotesquePro] m-0 leading-tight mt-1">Expires {formatted.expires}</p>
                                                        )}
                                                    </div>
                                                    {isCreditCard && !formatted.isPrimary && (
                                                        <button className="px-3 py-2 bg-white !border border-[#E8F0FF] text-gray-600 !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-xs sm:text-sm whitespace-nowrap">
                                                            Set Primary
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* PCI-Compliant Banner */}
                            <div className="bg-[#F0FDF4] !border border-[#BBF7D0] !rounded-lg p-4 sm:p-6">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M15 9.75034C15 13.5003 12.375 15.3753 9.255 16.4628C9.09162 16.5182 8.91415 16.5156 8.7525 16.4553C5.625 15.3753 3 13.5003 3 9.75034V4.50034C3 4.30142 3.07902 4.11066 3.21967 3.97001C3.36032 3.82936 3.55109 3.75034 3.75 3.75034C5.25 3.75034 7.125 2.85034 8.43 1.71034C8.58889 1.57459 8.79102 1.5 9 1.5C9.20898 1.5 9.41111 1.57459 9.57 1.71034C10.8825 2.85784 12.75 3.75034 14.25 3.75034C14.4489 3.75034 14.6397 3.82936 14.7803 3.97001C14.921 4.11066 15 4.30142 15 4.50034V9.75034Z" stroke="#166534" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>

                                    </div>
                                    <div>
                                        <h6 className="text-base font-semibold !text-[#166534] mb-1 font-[BasisGrotesquePro]">PCI-Compliant Secure Payment Processing</h6>
                                        <p className="text-sm text-green-700 font-[BasisGrotesquePro]">All payment information is encrypted with 256-bit SSL and processed through PCI DSS Level 1 compliant systems. We never store your full payment details and use tokenization for maximum security.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Add Payment Method Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <div className="flex justify-between items-start p-6 border-b" style={{ borderColor: '#E5E7EB' }}>
                                <div>
                                    <h4 className="text-2xl font-bold mb-1 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                                        Add Payment Method
                                    </h4>
                                    <p className="text-sm font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>
                                        Add a new payment method to your account
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-gray-600 transition-colors"
                                >
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                {/* Error Message */}
                                {error && (
                                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Form */}
                                <div className="space-y-4">
                                    {/* Card Number */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                                            Card Number
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="1234 5678 9012 3456"
                                            value={newPaymentMethod.cardNumber}
                                            onChange={(e) => {
                                                let value = e.target.value.replace(/\D/g, '');
                                                value = value.replace(/(.{4})/g, '$1 ').trim();
                                                setNewPaymentMethod({ ...newPaymentMethod, cardNumber: value });
                                                if (formErrors.cardNumber) {
                                                    setFormErrors({ ...formErrors, cardNumber: '' });
                                                }
                                            }}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro] ${formErrors.cardNumber ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        />
                                        {formErrors.cardNumber && (
                                            <p className="mt-1 text-sm text-red-600">{formErrors.cardNumber}</p>
                                        )}
                                    </div>

                                    {/* Cardholder Name */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                                            Cardholder Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            value={newPaymentMethod.cardholderName}
                                            onChange={(e) => {
                                                setNewPaymentMethod({ ...newPaymentMethod, cardholderName: e.target.value });
                                                if (formErrors.cardholderName) {
                                                    setFormErrors({ ...formErrors, cardholderName: '' });
                                                }
                                            }}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro] ${formErrors.cardholderName ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        />
                                        {formErrors.cardholderName && (
                                            <p className="mt-1 text-sm text-red-600">{formErrors.cardholderName}</p>
                                        )}
                                    </div>

                                    {/* Expiry Date and CVV */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                                                Expiry Date
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="MM/YY"
                                                value={newPaymentMethod.expiryDate}
                                                onChange={(e) => {
                                                    let value = e.target.value.replace(/\D/g, '');
                                                    if (value.length >= 2) {
                                                        value = value.substring(0, 2) + '/' + value.substring(2, 4);
                                                    }
                                                    setNewPaymentMethod({ ...newPaymentMethod, expiryDate: value });
                                                    if (formErrors.expiryDate) {
                                                        setFormErrors({ ...formErrors, expiryDate: '' });
                                                    }
                                                }}
                                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro] ${formErrors.expiryDate ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                            />
                                            {formErrors.expiryDate && (
                                                <p className="mt-1 text-sm text-red-600">{formErrors.expiryDate}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                                                CVV
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="123"
                                                value={newPaymentMethod.cvv}
                                                onChange={(e) => {
                                                    let value = e.target.value.replace(/\D/g, '');
                                                    value = value.substring(0, 4);
                                                    setNewPaymentMethod({ ...newPaymentMethod, cvv: value });
                                                    if (formErrors.cvv) {
                                                        setFormErrors({ ...formErrors, cvv: '' });
                                                    }
                                                }}
                                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro] ${formErrors.cvv ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                            />
                                            {formErrors.cvv && (
                                                <p className="mt-1 text-sm text-red-600">{formErrors.cvv}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Set as Default */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="setDefault"
                                            checked={newPaymentMethod.isDefault}
                                            onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, isDefault: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="setDefault" className="text-sm font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                                            Set as default payment method
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end gap-3 p-6 border-t" style={{ borderColor: '#E5E7EB' }}>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    disabled={saving}
                                    className="px-6 py-2 bg-white border !rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50 font-[BasisGrotesquePro]"
                                    style={{ borderColor: '#D1D5DB', color: '#374151' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePaymentMethod}
                                    disabled={saving}
                                    className="px-6 py-2 bg-[#F56D2D] text-white !rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#E55A1D] transition font-[BasisGrotesquePro]"
                                >
                                    {saving ? 'Adding...' : 'Add Payment Method'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Enterprise Tab Content */}
                {activeTab === 'Enterprise' && (
                    <div className="space-y-6 rounded-lg border border-[#E8F0FF] bg-white p-4 sm:p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                                    Multi-Office Enterprise Support
                                </h3>
                                <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                                    Revenue and cost analysis across all offices
                                </p>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-[#F0FAFD] px-3 py-1.5 text-sm text-[#0690AC] font-[BasisGrotesquePro]">
                                <span className="inline-flex h-2 w-2 rounded-full bg-[#3AD6F2]" />
                                Enterprise
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <div className="inline-flex w-max rounded-lg border border-[#E8F0FF] bg-white p-1.5 sm:p-2">
                                <div className="flex gap-2 sm:gap-3">
                                {enterpriseTabs.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveEnterpriseTab(tab)}
                                            className={`whitespace-nowrap px-3 py-1.5 text-xs font-[BasisGrotesquePro] font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm !rounded-lg ${
                                            activeEnterpriseTab === tab
                                                    ? 'bg-[#3AD6F2] text-white'
                                                : 'bg-transparent text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">{renderEnterpriseTab()}</div>
                    </div>
                )}

            </div>

            {/* Upgrade Plan Modal */}
            <UpgradePlanModal
                isOpen={isUpgradePlanModalOpen}
                onClose={() => setIsUpgradePlanModalOpen(false)}
                currentPlanName={currentPlan}
            />
        </div>
    );
};

export default SubscriptionManagement;
