import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { superAdminAPI, handleAPIError } from '../utils/superAdminAPI';
import { setTokens, clearUserData } from '../../ClientOnboarding/utils/userUtils';
import { getPathWithPrefix } from '../../ClientOnboarding/utils/urlUtils';
import { toast } from 'react-toastify';

import '../style/FirmDetails.css';

const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) {
        return '$0';
    }
    if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount}`;
};

const formatDate = (dateString) => {
    if (!dateString) {
        return 'Not available';
    }
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return 'Not available';
    }
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export default function FirmDetails() {
    const { firmId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('Overview');
    const [firmDetails, setFirmDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [settingsData, setSettingsData] = useState(null);
    const [settingsForm, setSettingsForm] = useState({
        name: '',
        phone_number: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: ''
    });
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsError, setSettingsError] = useState(null);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const settingsLoadedRef = useRef(false);
    const [billingOverview, setBillingOverview] = useState(null);
    const [billingLoading, setBillingLoading] = useState(false);
    const [billingError, setBillingError] = useState(null);
    const [loggingIn, setLoggingIn] = useState(false);

    const fetchFirmDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await superAdminAPI.getFirmById(firmId);

            if (response.success && response.data) {
                setFirmDetails(response.data);
            } else {
                throw new Error(response.message || 'Failed to fetch firm details');
            }
        } catch (err) {
            console.error('Error fetching firm details:', err);
            setError(handleAPIError(err));
            setFirmDetails(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (firmId) {
            fetchFirmDetails();
        }
    }, [firmId]);

    // Handle automatic login when action=login query parameter is present
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const action = params.get('action');

        if (action === 'login' && firmId && !loggingIn && firmDetails) {
            // Remove the action parameter from URL
            params.delete('action');
            const newSearch = params.toString();
            navigate({
                pathname: location.pathname,
                search: newSearch ? `?${newSearch}` : ''
            }, { replace: true });

            // Trigger login
            handleFirmLogin();
        }
    }, [location.search, firmId, firmDetails, loggingIn]);

    useEffect(() => {
        settingsLoadedRef.current = false;
        setSettingsData(null);
        setSettingsForm({
            name: '',
            phone_number: '',
            email: '',
            address: '',
            city: '',
            state: '',
            zip_code: '',
            country: ''
        });
        setSettingsError(null);
    }, [firmId]);

    const populateSettingsForm = useCallback((data = {}) => {
        setSettingsForm({
            name: data.name ?? '',
            phone_number: data.phone_number ?? '',
            email: data.email ?? '',
            address: data.address ?? '',
            city: data.city ?? '',
            state: data.state ?? '',
            zip_code: data.zip_code ?? '',
            country: data.country ?? ''
        });
    }, []);

    const fetchFirmSettings = useCallback(async () => {
        if (!firmId) return;
        try {
            setSettingsLoading(true);
            setSettingsError(null);
            const response = await superAdminAPI.getFirmSettings(firmId);

            if (response.success && response.data) {
                setSettingsData(response.data);
                populateSettingsForm(response.data);
                settingsLoadedRef.current = true;
            } else {
                throw new Error(response.message || 'Failed to fetch firm settings');
            }
        } catch (err) {
            console.error('Error fetching firm settings:', err);
            setSettingsError(handleAPIError(err));
        } finally {
            setSettingsLoading(false);
        }
    }, [firmId, populateSettingsForm]);

    const fetchFirmBillingOverview = useCallback(async () => {
        if (!firmId) return;
        try {
            setBillingLoading(true);
            setBillingError(null);
            const response = await superAdminAPI.getFirmBillingOverview(firmId);

            if (response.success && response.data) {
                setBillingOverview(response.data);
            } else {
                throw new Error(response.message || 'Failed to fetch billing overview');
            }
        } catch (err) {
            console.error('Error fetching billing overview:', err);
            setBillingError(handleAPIError(err));
            setBillingOverview(null);
        } finally {
            setBillingLoading(false);
        }
    }, [firmId]);

    const stats = useMemo(() => {
        return {
            users: firmDetails?.staff_count ?? 0,
            clients: firmDetails?.client_count ?? 0,
            revenue: formatCurrency(firmDetails?.monthly_fee ?? 0)
        };
    }, [firmDetails]);

    const systemHealth = useMemo(() => {
        return {
            totalUsers: firmDetails?.staff_count ?? 0,
            maxUsers: firmDetails?.max_users ?? 0,
            storageUsed: firmDetails?.storage_usage?.used_gb ?? 0,
            storageCapacity: firmDetails?.storage_usage?.limit_gb ?? 0,
            lastActive: firmDetails?.last_active ?? 'Not available'
        };
    }, [firmDetails]);

    useEffect(() => {
        if (activeTab === 'Settings' && firmId && !settingsLoadedRef.current) {
            fetchFirmSettings();
        } else if (activeTab === 'Billing' && firmId && !billingOverview) {
            fetchFirmBillingOverview();
        }
    }, [activeTab, firmId, fetchFirmSettings, fetchFirmBillingOverview, billingOverview]);

    const statCards = useMemo(
        () => [
            {
                id: 'users',
                label: 'Users',
                value: stats.users,
                subtitle: 'Active staff members',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M10.6673 14V12.6667C10.6673 11.9594 10.3864 11.2811 9.88627 10.781C9.38617 10.281 8.70789 10 8.00065 10H4.00065C3.29341 10 2.61513 10.281 2.11503 10.781C1.61494 11.2811 1.33398 11.9594 1.33398 12.6667V14M14.6673 14V12.6667C14.6669 12.0758 14.4702 11.5018 14.1082 11.0349C13.7462 10.5679 13.2394 10.2344 12.6673 10.0867M10.6673 2.08667C11.2409 2.23353 11.7493 2.56713 12.1124 3.03487C12.4755 3.50261 12.6725 4.07789 12.6725 4.67C12.6725 5.26211 12.4755 5.83739 12.1124 6.30513C11.7493 6.77287 11.2409 7.10647 10.6673 7.25333M8.66732 4.66667C8.66732 6.13943 7.47341 7.33333 6.00065 7.33333C4.52789 7.33333 3.33398 6.13943 3.33398 4.66667C3.33398 3.19391 4.52789 2 6.00065 2C7.47341 2 8.66732 3.19391 8.66732 4.66667Z"
                            stroke="#3AD6F2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )
            },
            {
                id: 'clients',
                label: 'Clients',
                value: stats.clients,
                subtitle: 'Total client accounts',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 22V4C6 3.46957 6.21071 2.96086 6.58579 2.58579C6.96086 2.21071 7.46957 2 8 2H16C16.5304 2 17.0391 2.21071 17.4142 2.58579C17.7893 2.96086 18 3.46957 18 4V22H6Z" stroke="#3AD6F2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M6 12H4C3.46957 12 2.96086 12.2107 2.58579 12.5858C2.21071 12.9609 2 13.4696 2 14V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H6" stroke="#3AD6F2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M18 9H20C20.5304 9 21.0391 9.21071 21.4142 9.58579C21.7893 9.96086 22 10.4696 22 11V20C22 20.5304 21.7893 21.0391 21.4142 21.4142C21.0391 21.7893 20.5304 22 20 22H18" stroke="#3AD6F2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M10 6H14" stroke="#3AD6F2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M10 10H14" stroke="#3AD6F2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M10 14H14" stroke="#3AD6F2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M10 18H14" stroke="#3AD6F2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>

                )
            },
            {
                id: 'revenue',
                label: 'Revenue',
                value: stats.revenue,
                subtitle: 'Monthly subscription',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M10 2V18M14 6H9.5C8.57174 6 7.6815 6.36875 7.02513 7.02513C6.36875 7.6815 6 8.57174 6 9.5C6 10.4283 6.36875 11.3185 7.02513 11.9749C7.6815 12.6313 8.57174 13 9.5 13H14.5C15.4283 13 16.3185 13.3687 16.9749 14.0251C17.6313 14.6815 18 15.5717 18 16.5C18 17.4283 17.6313 18.3185 16.9749 18.9749C16.3185 19.6313 15.4283 20 14.5 20H5"
                            stroke="#3AD6F2"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )
            }
        ],
        [stats]
    );

    const tabs = useMemo(() => [
        { id: 'Overview', label: 'Overview' },
        { id: 'Billing', label: 'Billing' },
        { id: 'Settings', label: 'Settings' }
    ], []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        if (tabParam) {
            const match = tabs.find(tab => tab.id.toLowerCase() === tabParam.toLowerCase());
            if (match && match.id !== activeTab) {
                setActiveTab(match.id);
            }
        } else if (activeTab !== 'Overview') {
            setActiveTab('Overview');
        }
    }, [location.search, activeTab, tabs]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        const params = new URLSearchParams(location.search);
        if (tabId === 'Overview') {
            params.delete('tab');
        } else {
            params.set('tab', tabId);
        }
        const search = params.toString();
        navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true });
    };

    const firmName = firmDetails?.name || 'Firm Details';
    const firmOwner = firmDetails?.admin_user_name || 'Not provided';
    const firmEmail = firmDetails?.admin_user_email || 'Not provided';
    const firmPhone = firmDetails?.phone_number || 'Not provided';
    const firmTaxId = firmDetails?.tax_id || 'Not provided';
    const firmJoinDate = firmDetails?.created_at || firmDetails?.joined_at;

    const billingInfo = useMemo(() => {
        return {
            plan: firmDetails?.subscription_plan_name || 'None',
            monthlyCost: formatCurrency(firmDetails?.monthly_fee ?? 0),
            nextBilling: formatDate(firmDetails?.next_billing_date) || 'Not available',
            status: firmDetails?.status
                ? firmDetails.status.charAt(0).toUpperCase() + firmDetails.status.slice(1)
                : 'Active'
        };
    }, [firmDetails]);

    const subscriptionHistory = useMemo(() => {
        if (Array.isArray(firmDetails?.subscription_history) && firmDetails.subscription_history.length > 0) {
            return firmDetails.subscription_history.map((entry, index) => ({
                id: entry.id || index,
                plan: entry.subscription_plan__display_name ||
                    (entry.subscription_plan__subscription_type
                        ? entry.subscription_plan__subscription_type.charAt(0).toUpperCase() + entry.subscription_plan__subscription_type.slice(1) + ' Plan'
                        : 'Professional Plan'),
                period: entry.period_start && entry.period_end
                    ? `${formatDate(entry.period_start)} - ${formatDate(entry.period_end)}`
                    : 'Not available',
                amount: formatCurrency(entry.amount ?? 0),
                status: entry.payment_status
                    ? entry.payment_status.charAt(0).toUpperCase() + entry.payment_status.slice(1)
                    : 'Completed'
            }));
        }

        // Return empty array if no subscription history available
        return [];
    }, [firmDetails]);

    const handleSettingsInputChange = (field, value) => {
        setSettingsForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleResetSettingsForm = () => {
        if (settingsData) {
            populateSettingsForm(settingsData);
        } else {
            populateSettingsForm({});
        }
        setSettingsError(null);
    };

    const handleSubmitSettings = async () => {
        if (!firmId) return;
        try {
            setSettingsSaving(true);
            setSettingsError(null);
            const response = await superAdminAPI.updateFirmSettings(firmId, settingsForm);

            if (response.success && response.data) {
                setSettingsData(response.data);
                populateSettingsForm(response.data);
                settingsLoadedRef.current = true;
                setFirmDetails(prev => prev ? {
                    ...prev,
                    name: response.data.name ?? prev.name,
                    phone_number: response.data.phone_number ?? prev.phone_number,
                    admin_user_email: response.data.email ?? prev.admin_user_email,
                    email: response.data.email ?? prev.email,
                    address: response.data.address ?? prev.address,
                    city: response.data.city ?? prev.city,
                    state: response.data.state ?? prev.state,
                    zip_code: response.data.zip_code ?? prev.zip_code,
                    country: response.data.country ?? prev.country,
                } : prev);
            } else {
                throw new Error(response.message || 'Failed to update firm settings');
            }
        } catch (err) {
            console.error('Error updating firm settings:', err);
            setSettingsError(handleAPIError(err));
        } finally {
            setSettingsSaving(false);
        }
    };

    const handleFirmLogin = async () => {
        if (!firmId) return;

        try {
            setLoggingIn(true);

            console.log('[IMPERSONATION_START] Initiating firm login', {
                timestamp: new Date().toISOString(),
                firmId: firmId,
                currentUserType: localStorage.getItem('userType') || sessionStorage.getItem('userType'),
                currentRoute: window.location.pathname,
            });

            const response = await superAdminAPI.generateFirmLogin(firmId);

            if (response.success && response.data) {
                const { access_token, refresh_token, user, firm } = response.data;

                console.log('[IMPERSONATION_START] Received firm credentials', {
                    hasFirmData: !!firm,
                    firmName: firm?.name,
                    targetUserType: user?.user_type,
                    targetUserEmail: user?.email,
                });

                // STEP 1: Store original Super Admin session data for revert functionality
                const originalSessionData = {
                    accessToken: localStorage.getItem('accessToken'),
                    refreshToken: localStorage.getItem('refreshToken'),
                    userData: localStorage.getItem('userData'),
                    userType: localStorage.getItem('userType'),
                    isLoggedIn: localStorage.getItem('isLoggedIn'),
                    rememberMe: localStorage.getItem('rememberMe'),
                    sessionAccessToken: sessionStorage.getItem('accessToken'),
                    sessionRefreshToken: sessionStorage.getItem('refreshToken'),
                    sessionUserData: sessionStorage.getItem('userData'),
                    sessionUserType: sessionStorage.getItem('userType'),
                    sessionIsLoggedIn: sessionStorage.getItem('isLoggedIn'),
                    sessionRememberMe: sessionStorage.getItem('rememberMe'),
                    timestamp: Date.now()
                };

                console.log('[IMPERSONATION_START] Stored original session data', {
                    hasAccessToken: !!originalSessionData.accessToken,
                    hasRefreshToken: !!originalSessionData.refreshToken,
                    originalUserType: originalSessionData.userType,
                    sessionTimestamp: originalSessionData.timestamp,
                });

                // Store in sessionStorage so it's cleared when browser tab closes
                sessionStorage.setItem('superAdminImpersonationData', JSON.stringify(originalSessionData));

                // Also store firm info for UI display
                const impersonationInfo = {
                    firmName: firm?.name || 'Unknown Firm',
                    firmId: firm?.id || firmId,
                    impersonatedAt: new Date().toISOString()
                };
                sessionStorage.setItem('impersonationInfo', JSON.stringify(impersonationInfo));

                console.log('[IMPERSONATION_START] Stored impersonation info', impersonationInfo);

                // STEP 2: Completely clear all superadmin session data using utility function
                console.log('[IMPERSONATION_START] Clearing Super Admin context');
                clearUserData();

                // Also clear any additional superadmin-specific data
                localStorage.removeItem('firmLoginData');
                sessionStorage.removeItem('firmLoginData');

                // STEP 3: Set new firm admin tokens and user data
                console.log('[IMPERSONATION_START] Setting firm admin session');

                // Use setTokens to properly set tokens
                setTokens(access_token, refresh_token, true);

                // Set user data in both storages for consistency
                localStorage.setItem('userData', JSON.stringify(user));
                localStorage.setItem('userType', user.user_type || 'admin');
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('rememberMe', 'true');

                sessionStorage.setItem('accessToken', access_token);
                sessionStorage.setItem('refreshToken', refresh_token);
                sessionStorage.setItem('userData', JSON.stringify(user));
                sessionStorage.setItem('userType', user.user_type || 'admin');
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('rememberMe', 'true');

                console.log('[IMPERSONATION_START] Firm admin session established', {
                    newUserType: user.user_type,
                    newUserEmail: user.email,
                    firmId: firm?.id,
                    firmName: firm?.name,
                });

                toast.success(response.message || 'Login successful. Redirecting to firm dashboard...', {
                    position: "top-right",
                    autoClose: 2000,
                });

                // STEP 4: Navigate to firm admin dashboard with a small delay to ensure state is cleared
                // Use window.location.href for a hard navigation to ensure clean state and prevent loops
                console.log('[IMPERSONATION_START] Preparing navigation to firm dashboard');
                setTimeout(() => {
                    const targetUrl = getPathWithPrefix('/firmadmin');
                    console.log('[IMPERSONATION_START] Navigating to:', targetUrl);
                    window.location.href = targetUrl;
                }, 300);
            } else {
                throw new Error(response.message || 'Failed to generate login credentials');
            }
        } catch (err) {
            console.error('[IMPERSONATION_START] Error during firm login:', err);
            console.error('[IMPERSONATION_START] Error stack:', err.stack);

            toast.error(handleAPIError(err), {
                position: "top-right",
                autoClose: 3000,
            });
            setLoggingIn(false);
        }
    };

    const quickActions = [
        {
            id: 'upgrade', label: 'Upgrade Plan', icon: (<svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.5003 0.625V5.625C17.5003 5.79076 17.4345 5.94973 17.3173 6.06694C17.2001 6.18415 17.0411 6.25 16.8753 6.25C16.7096 6.25 16.5506 6.18415 16.4334 6.06694C16.3162 5.94973 16.2503 5.79076 16.2503 5.625V2.13359L9.81753 8.56719C9.75949 8.6253 9.69056 8.6714 9.61468 8.70285C9.53881 8.7343 9.45748 8.75049 9.37535 8.75049C9.29321 8.75049 9.21188 8.7343 9.13601 8.70285C9.06014 8.6714 8.9912 8.6253 8.93316 8.56719L6.25035 5.88359L1.06753 11.0672C0.95026 11.1845 0.7912 11.2503 0.625347 11.2503C0.459495 11.2503 0.300435 11.1845 0.18316 11.0672C0.0658847 10.9499 0 10.7909 0 10.625C0 10.4591 0.0658847 10.3001 0.18316 10.1828L5.80816 4.55781C5.86621 4.4997 5.93514 4.4536 6.01101 4.42215C6.08688 4.3907 6.16821 4.37451 6.25035 4.37451C6.33248 4.37451 6.41381 4.3907 6.48968 4.42215C6.56556 4.4536 6.63449 4.4997 6.69253 4.55781L9.37535 7.24141L15.3668 1.25H11.8753C11.7096 1.25 11.5506 1.18415 11.4334 1.06694C11.3162 0.949731 11.2503 0.79076 11.2503 0.625C11.2503 0.45924 11.3162 0.300269 11.4334 0.183058C11.5506 0.0658481 11.7096 0 11.8753 0H16.8753C17.0411 0 17.2001 0.0658481 17.3173 0.183058C17.4345 0.300269 17.5003 0.45924 17.5003 0.625Z" fill="#3B4A66" />
            </svg>
            )
        },
        {
            id: 'downgrade', label: 'Downgrade Plan', icon: (<svg width="18" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.7503 15.625V10.625C18.7503 10.4592 18.6845 10.3003 18.5673 10.1831C18.4501 10.0658 18.2911 10 18.1253 10C17.9596 10 17.8006 10.0658 17.6834 10.1831C17.5662 10.3003 17.5003 10.4592 17.5003 10.625V14.1164L11.0675 7.68281C11.0095 7.6247 10.9406 7.5786 10.8647 7.54715C10.7888 7.5157 10.7075 7.49951 10.6253 7.49951C10.5432 7.49951 10.4619 7.5157 10.386 7.54715C10.3101 7.5786 10.2412 7.6247 10.1832 7.68281L7.50035 10.3664L2.31753 5.18281C2.20026 5.06554 2.0412 4.99965 1.87535 4.99965C1.7095 4.99965 1.55044 5.06554 1.43316 5.18281C1.31588 5.30009 1.25 5.45915 1.25 5.625C1.25 5.79085 1.31588 5.94991 1.43316 6.06719L7.05816 11.6922C7.11621 11.7503 7.18514 11.7964 7.26101 11.8278C7.33688 11.8593 7.41821 11.8755 7.50035 11.8755C7.58248 11.8755 7.66381 11.8593 7.73968 11.8278C7.81556 11.7964 7.88449 11.7503 7.94253 11.6922L10.6253 9.00859L16.6168 15H13.1253C12.9596 15 12.8006 15.0658 12.6834 15.1831C12.5662 15.3003 12.5003 15.4592 12.5003 15.625C12.5003 15.7908 12.5662 15.9497 12.6834 16.0669C12.8006 16.1842 12.9596 16.25 13.1253 16.25H18.1253C18.2911 16.25 18.4501 16.1842 18.5673 16.0669C18.6845 15.9497 18.7503 15.7908 18.7503 15.625Z" fill="#3B4A66" />
            </svg>
            )
        },
        {
            id: 'extend', label: 'Extend Trial', icon: (<svg width="18" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M10.5013 9.58714L13.7438 12.8296L13.0371 13.5371L9.5013 10.0013V5.0013H10.5013V9.58714ZM10.0013 18.3346C5.3988 18.3346 1.66797 14.6038 1.66797 10.0013C1.66797 5.3988 5.3988 1.66797 10.0013 1.66797C14.6038 1.66797 18.3346 5.3988 18.3346 10.0013C18.3346 14.6038 14.6038 18.3346 10.0013 18.3346ZM10.0013 17.3346C11.9462 17.3346 13.8115 16.562 15.1868 15.1868C16.562 13.8115 17.3346 11.9462 17.3346 10.0013C17.3346 8.05638 16.562 6.19112 15.1868 4.81585C13.8115 3.44059 11.9462 2.66797 10.0013 2.66797C8.05638 2.66797 6.19112 3.44059 4.81585 4.81585C3.44059 6.19112 2.66797 8.05638 2.66797 10.0013C2.66797 11.9462 3.44059 13.8115 4.81585 15.1868C6.19112 16.562 8.05638 17.3346 10.0013 17.3346Z" fill="#3B4A66" />
            </svg>
            )
        },
        {
            id: 'suspend', label: 'Suspend Account', icon: (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.0012 13.3346H10.0079M10.0012 8.33461V10.8346M8.81368 4.34878L2.93202 14.1679C2.81083 14.378 2.74674 14.6161 2.7461 14.8585C2.74546 15.101 2.80831 15.3395 2.92838 15.5501C3.04846 15.7608 3.22159 15.9363 3.43056 16.0594C3.63953 16.1824 3.87705 16.2485 4.11952 16.2513H15.8829C16.1254 16.2488 16.3631 16.1828 16.5722 16.0598C16.7813 15.9369 16.9546 15.7613 17.0747 15.5505C17.1948 15.3398 17.2576 15.1012 17.2569 14.8587C17.2561 14.6161 17.1918 14.3779 17.0703 14.1679L11.1895 4.34878C11.0658 4.14455 10.8915 3.97568 10.6835 3.85847C10.4755 3.74126 10.2408 3.67969 10.002 3.67969C9.76325 3.67969 9.52852 3.74126 9.32051 3.85847C9.11249 3.97568 8.93821 4.14455 8.81452 4.34878" stroke="#3B4A66" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-[rgb(243,247,255)] dark:bg-gray-900 lg:px-4 sm:px-1 lg:py-6 md:py-4 sm:py-2 md:px-4 firmdetails-page">
            <div className="mx-auto flex w-full flex-col gap-6 firmdetails-container">
                <div className="flex flex-col items-start justify-between gap-3 rounded-2xl px-6 py-3 sm:flex-row sm:items-center firmdetails-header">
                    <div className="space-y-1">
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{firmName || 'Firm Details'}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage all firms registered on the platform</p>
                    </div>

                </div>

                {loading && (
                    <div className="flex min-h-[50vh] w-full items-center justify-center">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-b-transparent border-[#F56D2D]" />
                            Loading firm details...
                        </div>
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                        <div className="flex items-start gap-3">
                            <div className="rounded-full bg-red-100 p-2 text-red-500">
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11a.75.75 0 10-1.5 0v4a.75.75 0 001.5 0V7zm0 6a.75.75 0 10-1.5 0 .75.75 0 001.5 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-red-800">Unable to load firm details</h3>
                                <p className="mt-1 text-sm text-red-700">{error}</p>
                                <button
                                    type="button"
                                    onClick={fetchFirmDetails}
                                    className="mt-4 inline-flex items-center rounded-lg bg-red-100 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {!loading && !error && !firmDetails && (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
                        <h3 className="text-lg font-semibold text-gray-900">Firm not found</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            The requested firm could not be located. It may have been removed or you may not have access.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/superadmin/firms')}
                            className="mt-4 inline-flex items-center rounded-lg bg-[#F56D2D] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
                            style={{ borderRadius: '8px' }}
                        >
                            Return to Firm Management
                        </button>
                    </div>
                )}

                {!loading && firmDetails && (
                    <>
                        <button
                            type="button"
                            onClick={() => navigate('/superadmin/firms')}
                            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#3B4A66] hover:underline focus:outline-none"
                        >
                            ← Back to Firm Management
                        </button>

                        <div className="rounded-lg bg-white px-4 py-2 firmdetails-tabs-card dark:bg-gray-800">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between firmdetails-tabs-row">
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2 p-2 firmdetails-tabs">
                                        {tabs.map((tab) => {
                                            const isActive = activeTab === tab.id;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    type="button"
                                                    onClick={() => handleTabChange(tab.id)}
                                                    className={`px-5 py-2 text-sm font-medium transition-colors ${isActive
                                                        ? 'bg-[#3B4A66] text-white'
                                                        : 'bg-white text-black hover:bg-[#DDE5FF] dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                                                        }`}
                                                    style={{ borderRadius: '8px' }}
                                                >
                                                    {tab.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleFirmLogin}
                                        disabled={loggingIn}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#F56D2D] text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ borderRadius: '8px' }}
                                    >
                                        {loggingIn ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-white"></div>
                                                Logging in...
                                            </>
                                        ) : (
                                            <>
                                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M15.8333 9.16667V5.83333C15.8333 5.39131 15.6577 4.96738 15.345 4.65482C15.0325 4.34226 14.6085 4.16667 14.1667 4.16667H5.83333C5.39131 4.16667 4.96738 4.34226 4.65482 4.65482C4.34226 4.96738 4.16667 5.39131 4.16667 5.83333V14.1667C4.16667 14.6087 4.34226 15.0326 4.65482 15.3452C4.96738 15.6577 5.39131 15.8333 5.83333 15.8333H14.1667C14.6085 15.8333 15.0325 15.6577 15.345 15.3452C15.6577 15.0326 15.8333 14.6087 15.8333 14.1667V10.8333M12.5 10H18.3333M18.3333 10L16.25 7.91667M18.3333 10L16.25 12.0833" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Login as Firm
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {activeTab === 'Overview' && (
                            <>
                                <div className="grid gap-4 md:grid-cols-3 firmdetails-overview-metrics">
                                    {statCards.map(({ id, label, value, subtitle, icon }) => (
                                        <div
                                            key={id}
                                            className="flex flex-col gap-2 rounded-xl bg-white p-4 dark:bg-gray-800"
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-gray-400">
                                                    {label}
                                                </p>
                                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F7FB] dark:bg-gray-700">
                                                    {icon}
                                                </span>
                                            </div>
                                            <p className="text-2xl font-semibold text-[#0F172A] dark:text-white">{value}</p>
                                            <p className="text-xs text-[#94A3B8] dark:text-gray-500">{subtitle}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid gap-4 lg:grid-cols-2 xl:gap-6 firmdetails-overview-grid">
                                    <div className="rounded-xl bg-white/90 p-6 dark:bg-gray-800/90">
                                        <h5 className="text-lg font-medium text-grey-600 dark:text-white">Firm Information</h5>
                                        <div className="mt-6 space-y-4 text-sm">
                                            {[
                                                firmOwner !== 'Not provided' && { label: 'Owner:', value: firmOwner },
                                                firmEmail !== 'Not provided' && { label: 'Email:', value: firmEmail },
                                                firmPhone !== 'Not provided' && { label: 'Phone:', value: firmPhone },
                                                firmDetails?.subscription_plan && {
                                                    label: 'Plan:',
                                                    value: firmDetails.subscription_plan_name ||
                                                        (firmDetails.subscription_plan.charAt(0).toUpperCase() + firmDetails.subscription_plan.slice(1))
                                                },
                                                firmJoinDate && { label: 'Join Date:', value: formatDate(firmJoinDate) }
                                            ].filter(Boolean).map(({ label, value }) => (
                                                <div
                                                    key={label}
                                                    className="grid grid-cols-1 gap-1 sm:grid-cols-[140px_1fr] sm:items-center border-b border-gray-100 last:border-0 pb-3 last:pb-0 dark:border-gray-700"
                                                >
                                                    <span className="text-sm font-medium text-[#64748B] sm:text-base dark:text-gray-400">{label}</span>
                                                    <span className="text-sm font-semibold text-[#0F172A] sm:text-left sm:text-base dark:text-white truncate">
                                                        {value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-xl bg-white/90 p-6 dark:bg-gray-800/90">
                                        <h5 className="text-lg font-semibold text-[#1E293B] dark:text-white">System Health</h5>
                                        <div className="mt-6 space-y-6">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs font-medium text-[#475569] dark:text-gray-400">
                                                    <span>Total Users</span>
                                                    <span>
                                                        {systemHealth.totalUsers}
                                                        {systemHealth.maxUsers ? ` / ${systemHealth.maxUsers}` : ''}
                                                    </span>
                                                </div>
                                                {systemHealth.maxUsers > 0 && (
                                                    <div className="h-2.5 w-full rounded-full bg-[#EEF4FF] dark:bg-gray-700">
                                                        <div
                                                            className="h-full rounded-full bg-[#3B4A66]"
                                                            style={{
                                                                width: `${Math.min(
                                                                    100,
                                                                    Math.round((systemHealth.totalUsers / systemHealth.maxUsers) * 100)
                                                                )}%`
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs font-medium text-[#475569] dark:text-gray-400">
                                                    <span>Storage Used</span>
                                                    <span>
                                                        {systemHealth.storageUsed}GB / {systemHealth.storageCapacity}GB
                                                    </span>
                                                </div>
                                                <div className="h-2.5 w-full rounded-full bg-[#EEF4FF] dark:bg-gray-700">
                                                    <div
                                                        className="h-full rounded-full bg-[#3B4A66]"
                                                        style={{
                                                            width: `${Math.min(
                                                                100,
                                                                Math.round(
                                                                    (systemHealth.storageUsed / systemHealth.storageCapacity) * 100 || 0
                                                                )
                                                            )}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-medium text-[#475569] dark:text-gray-400">
                                                <svg width="14" height="14" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M11.3333 0.5L6.72917 5.10417L4.02083 2.39583L0.5 5.91667" stroke="#22C55E" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Last active:{' '}
                                                <span className="font-semibold text-[#1F2937] dark:text-white">
                                                    {systemHealth.lastActive || 'Recently'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'Billing' && (
                            <BillingOverviewTab
                                overview={billingOverview}
                                loading={billingLoading}
                                error={billingError}
                                onRetry={fetchFirmBillingOverview}
                                firmDetails={firmDetails}
                                fallbackSubscription={{
                                    plan: billingInfo.plan,
                                    monthly_cost_display: billingInfo.monthlyCost,
                                    next_billing_display: billingInfo.nextBilling,
                                    status_display: billingInfo.status,
                                    status: billingInfo.status
                                }}
                            />
                        )}



                        {activeTab === 'Settings' && (
                            <div className="rounded-xl bg-white/95 dark:bg-gray-800/95 p-6">
                                <div className="flex items-start justify-between gap-4 firmdetails-settings-header">
                                    <div>
                                        <h5 className="text-xl font-semibold text-[#1E293B] dark:text-white">Firm Settings</h5>
                                        <p className="mt-1 text-sm text-[#64748B] dark:text-gray-400">
                                            Update firm contact details and address information.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleResetSettingsForm}
                                        disabled={settingsLoading || settingsSaving}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F6F8FE] dark:bg-gray-700 text-[#94A3B8] dark:text-gray-400 transition-colors hover:bg-[#EEF3FF] dark:hover:bg-gray-600 hover:text-[#475569] dark:hover:text-gray-300 disabled:opacity-50"
                                        title="Reset changes"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M3 3L9 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M9 3L3 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>

                                {settingsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-[#64748B] dark:text-gray-400">
                                        <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-b-transparent border-[#F56D2D] dark:border-orange-400" />
                                        Loading firm settings...
                                    </div>
                                ) : (
                                    <form className="mt-6 space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmitSettings(); }}>
                                        {settingsError && (
                                            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                                                {settingsError}
                                            </div>
                                        )}

                                        <div className="grid gap-4">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-medium text-[#475569] dark:text-gray-300">Firm Name</label>
                                                <input
                                                    type="text"
                                                    value={settingsForm.name}
                                                    onChange={(e) => handleSettingsInputChange('name', e.target.value)}
                                                    className="w-full rounded-lg border border-[#E2E8F0] dark:border-gray-600 px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white bg-white dark:bg-gray-700 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#BFD4FF] dark:focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2 firmdetails-settings-row">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-medium text-[#475569] dark:text-gray-300">Phone Number</label>
                                                <input
                                                    type="text"
                                                    value={settingsForm.phone_number}
                                                    onChange={(e) => handleSettingsInputChange('phone_number', e.target.value)}
                                                    className="w-full rounded-lg border border-[#E2E8F0] dark:border-gray-600 px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white bg-white dark:bg-gray-700 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#BFD4FF] dark:focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-medium text-[#475569] dark:text-gray-300">Email Address</label>
                                                <input
                                                    type="email"
                                                    value={settingsForm.email}
                                                    readOnly
                                                    className="w-full rounded-lg border border-[#E2E8F0] dark:border-gray-600 px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-gray-400 bg-gray-50 dark:bg-gray-800 cursor-not-allowed shadow-sm"
                                                    title="Email address cannot be changed"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-medium text-[#475569] dark:text-gray-300">Street Address</label>
                                                <input
                                                    type="text"
                                                    value={settingsForm.address}
                                                    onChange={(e) => handleSettingsInputChange('address', e.target.value)}
                                                    className="w-full rounded-lg border border-[#E2E8F0] dark:border-gray-600 px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white bg-white dark:bg-gray-700 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#BFD4FF] dark:focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-4 firmdetails-settings-row">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-medium text-[#475569] dark:text-gray-300">City</label>
                                                <input
                                                    type="text"
                                                    value={settingsForm.city}
                                                    onChange={(e) => handleSettingsInputChange('city', e.target.value)}
                                                    className="w-full rounded-lg border border-[#E2E8F0] dark:border-gray-600 px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white bg-white dark:bg-gray-700 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#BFD4FF] dark:focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-medium text-[#475569] dark:text-gray-300">State</label>
                                                <input
                                                    type="text"
                                                    value={settingsForm.state}
                                                    onChange={(e) => handleSettingsInputChange('state', e.target.value)}
                                                    className="w-full rounded-lg border border-[#E2E8F0] dark:border-gray-600 px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white bg-white dark:bg-gray-700 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#BFD4FF] dark:focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-medium text-[#475569] dark:text-gray-300">ZIP / Postal</label>
                                                <input
                                                    type="text"
                                                    value={settingsForm.zip_code}
                                                    onChange={(e) => handleSettingsInputChange('zip_code', e.target.value)}
                                                    className="w-full rounded-lg border border-[#E2E8F0] dark:border-gray-600 px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white bg-white dark:bg-gray-700 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#BFD4FF] dark:focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-medium text-[#475569] dark:text-gray-300">Country</label>
                                                <input
                                                    type="text"
                                                    value={settingsForm.country}
                                                    onChange={(e) => handleSettingsInputChange('country', e.target.value)}
                                                    className="w-full rounded-lg border border-[#E2E8F0] dark:border-gray-600 px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white bg-white dark:bg-gray-700 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#BFD4FF] dark:focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end firmdetails-settings-actions">
                                            <button
                                                type="button"
                                                onClick={handleResetSettingsForm}
                                                disabled={settingsSaving}
                                                className="border border-[#E2E8F0] dark:border-gray-600 inline-flex items-center justify-center rounded-lg bg-white dark:bg-gray-700 px-5 py-2 text-sm font-semibold text-[#475569] dark:text-gray-300 transition-colors hover:bg-[#F8FAFC] dark:hover:bg-gray-600 disabled:opacity-50"
                                                style={{ borderRadius: '8px' }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={settingsSaving}
                                                className="inline-flex items-center justify-center rounded-lg px-5 py-2 text-sm font-semibold text-white bg-[#F56D2D] dark:bg-orange-600 transition-colors hover:bg-orange-600 dark:hover:bg-orange-700 disabled:opacity-50"
                                                style={{ borderRadius: '8px' }}
                                            >
                                                {settingsSaving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Login Button at Bottom */}
                {!loading && firmDetails && (
                    <div className="flex justify-center pt-6 pb-4">
                        <button
                            type="button"
                            onClick={handleFirmLogin}
                            disabled={loggingIn}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#3B4A66] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2D3A52] focus:outline-none focus:ring-2 focus:ring-[#3B4A66] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ borderRadius: '8px' }}
                        >
                            {loggingIn ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-white"></div>
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 2C4.89543 2 4 2.89543 4 4V6H2V14H10V6H8V4C8 2.89543 7.10457 2 6 2ZM6 3C6.55228 3 7 3.44772 7 4V6H5V4C5 3.44772 5.44772 3 6 3Z" fill="currentColor" />
                                        <path d="M11 5V7H13V13H11V15H14C14.5523 15 15 14.5523 15 14V6C15 5.44772 14.5523 5 14 5H11Z" fill="currentColor" />
                                    </svg>
                                    Login
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

const BillingOverviewTab = ({
    overview,
    loading,
    error,
    onRetry,
    firmDetails,
    fallbackQuickActions = [],
    fallbackHistory = [],
    fallbackSubscription = {}
}) => {
    if (loading) {
        return (
            <div className="flex min-h-[320px] items-center justify-center rounded-xl bg-white">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-b-transparent border-[#F56D2D]" />
                    Loading billing overview...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                <div className="flex flex-col gap-3">
                    <div className="text-sm text-red-600">{error}</div>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="inline-flex items-center gap-2 self-start rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const iconMap = {
        'trending-up': '↗',
        'trending-down': '↘',
        'clock': '🕒',
        'alert': '⚠️'
    };

    const renderActionIcon = (icon) => {
        if (React.isValidElement(icon)) {
            return icon;
        }
        if (typeof icon === 'string') {
            const mapped = iconMap[icon.toLowerCase?.() || icon];
            if (mapped) {
                return <span className="text-base leading-none">{mapped}</span>;
            }
        }
        return <span className="text-base leading-none">•</span>;
    };

    const getStatusClasses = (color, statusValue) => {
        const normalized = (color || statusValue || '').toString().toLowerCase();
        if (normalized.includes('green') || normalized.includes('paid') || normalized.includes('active')) {
            return 'bg-[#DCFCE7] text-[#166534]';
        }
        if (normalized.includes('yellow') || normalized.includes('pending')) {
            return 'bg-[#FEF9C3] text-[#92400E]';
        }
        if (normalized.includes('red') || normalized.includes('overdue') || normalized.includes('suspended')) {
            return 'bg-[#FEE2E2] text-[#B91C1C]';
        }
        return 'bg-[#E2E8F0] text-[#475569]';
    };

    const formatPeriod = (period, entry) => {
        if (period?.display) {
            return period.display;
        }
        if (period?.start && period?.end) {
            return `${formatDate(period.start)} - ${formatDate(period.end)}`;
        }
        if (entry?.period) {
            return entry.period;
        }
        return '—';
    };

    const currentSubscription = Object.keys(overview?.current_subscription || {}).length > 0
        ? overview.current_subscription
        : {
            plan: fallbackSubscription.plan,
            monthly_cost_display: fallbackSubscription.monthlyCost,
            next_billing_display: fallbackSubscription.nextBilling,
            status_display: fallbackSubscription.status,
            status: fallbackSubscription.status?.toLowerCase()
        };

    const quickActions = (Array.isArray(overview?.quick_actions) && overview.quick_actions.length > 0
        ? overview.quick_actions
        : fallbackQuickActions
    ).map(action => ({
        ...action,
        enabled: action?.enabled !== undefined ? action.enabled : true
    }));

    const history = Array.isArray(overview?.subscription_history) && overview.subscription_history.length > 0
        ? overview.subscription_history
        : Array.isArray(firmDetails?.subscription_history) && firmDetails.subscription_history.length > 0
            ? firmDetails.subscription_history
            : fallbackHistory;

    const metrics = overview?.metrics || {};
    const historyCount = overview?.history_count ?? history.length ?? 0;

    return (
        <div className="flex flex-col">
            <div className="grid gap-6 ">
                <div className="rounded-xl bg-white p-6">
                    <div className="mb-5 flex items-start justify-between gap-3">
                        <div>
                            <h5 className="text-lg font-semibold text-[#1E293B]">Current Subscription</h5>
                            <p className="text-sm text-[#64748B]">
                                Manage and monitor the firm&apos;s active subscription plan.
                            </p>
                        </div>
                        {(overview?.firm?.status_display || fallbackSubscription?.status) && (
                            <span className="inline-flex items-center rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#312E81]">
                                {overview?.firm?.status_display || fallbackSubscription.status}
                            </span>
                        )}
                    </div>

                    <div className="divide-y divide-[#EFF4FF] rounded-xl border border-[#EFF4FF]">
                        {[{
                            label: 'Plan',
                            value: currentSubscription.plan || currentSubscription.plan_display || '—',
                            badge: true
                        }, {
                            label: 'Monthly Cost',
                            value: currentSubscription.monthly_cost_display || currentSubscription.amount_formatted || formatCurrency(currentSubscription.monthly_cost)
                        }, {
                            label: 'Next Billing Date',
                            value: currentSubscription.next_billing_display || currentSubscription.next_billing_date || '—'
                        }, {
                            label: 'Status',
                            value: currentSubscription.status_display || currentSubscription.status_label || currentSubscription.status || '—',
                            status: currentSubscription.status || currentSubscription.status_display?.toLowerCase()
                        }, {
                            label: 'Setup Fee',
                            value: firmDetails?.setup_fee ? formatCurrency(firmDetails.setup_fee) : '$0.00'
                        }, {
                            label: 'Trial Days Remaining',
                            value: currentSubscription.trial_days_remaining != null
                                ? `${currentSubscription.trial_days_remaining} day${currentSubscription.trial_days_remaining === 1 ? '' : 's'}`
                                : '—'
                        }].map(({ label, value, badge, status }) => (
                            <div key={label} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <span className="text-sm font-medium text-[#475569]">{label}</span>
                                {badge ? (
                                    <span className="inline-flex items-center rounded-full bg-[#EFF4FF] px-3 py-1 text-xs font-semibold text-[#1E3A8A]">
                                        {value}
                                    </span>
                                ) : status ? (
                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(null, status)}`}>
                                        {value}
                                    </span>
                                ) : (
                                    <span className="text-sm font-semibold text-[#0F172A]">{value}</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Usage Limits Section */}
                    <div className="mt-6">
                        <h6 className="text-base font-semibold text-[#1E293B] mb-4">Usage Limits</h6>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {[{
                                title: 'Max Users',
                                value: firmDetails?.max_users ?? '—',
                                subtitle: 'Staff members allowed'
                            }, {
                                title: 'Max Clients',
                                value: firmDetails?.max_clients ?? '—',
                                subtitle: 'Client accounts allowed'
                            }, {
                                title: 'Storage Limit',
                                value: firmDetails?.storage_limit_gb ? `${firmDetails.storage_limit_gb}GB` : '—',
                                subtitle: 'Total storage capacity'
                            }].map(({ title, value, subtitle }) => (
                                <div key={title} className="rounded-xl border border-[#EFF4FF] bg-[#F9FBFF] p-4">
                                    <p className="text-xs font-medium uppercase tracking-wide text-[#94A3B8]">{title}</p>
                                    <p className="mt-1 text-lg font-semibold text-[#1F2937]">{value}</p>
                                    <p className="text-xs text-[#64748B] mt-1">{subtitle}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Subscription Dates Section */}
                    <div className="mt-6">
                        <h6 className="text-base font-semibold text-[#1E293B] mb-4">Subscription Dates</h6>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {[{
                                title: 'Subscription Start',
                                value: firmDetails?.subscription_start_date ? formatDate(firmDetails.subscription_start_date) : 'Not available',
                                subtitle: 'When subscription began'
                            }, {
                                title: 'Subscription End',
                                value: firmDetails?.subscription_end_date ? formatDate(firmDetails.subscription_end_date) : 'Not available',
                                subtitle: 'When subscription expires'
                            }, {
                                title: 'Trial End Date',
                                value: firmDetails?.trial_end_date ? formatDate(firmDetails.trial_end_date) : 'Not available',
                                subtitle: 'Trial period expiration'
                            }].map(({ title, value, subtitle }) => (
                                <div key={title} className="rounded-xl border border-[#EFF4FF] bg-[#F9FBFF] p-4">
                                    <p className="text-xs font-medium uppercase tracking-wide text-[#94A3B8]">{title}</p>
                                    <p className="mt-1 text-sm font-semibold text-[#1F2937]">{value}</p>
                                    <p className="text-xs text-[#64748B] mt-1">{subtitle}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Storage Usage Section */}
                    <div className="mt-6">
                        <h6 className="text-base font-semibold text-[#1E293B] mb-4">Storage Usage</h6>
                        <div className="rounded-xl border border-[#EFF4FF] bg-[#F9FBFF] p-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-[#475569]">Storage Used</span>
                                    <span className="font-semibold text-[#1F2937]">
                                        {firmDetails?.storage_usage?.used_gb ?? 0}GB / {firmDetails?.storage_usage?.limit_gb ?? 0}GB
                                    </span>
                                </div>
                                <div className="h-2.5 w-full rounded-full bg-[#EEF4FF]">
                                    <div
                                        className="h-full rounded-full bg-[#3B4A66]"
                                        style={{
                                            width: `${Math.min(100, Math.round((firmDetails?.storage_usage?.used_gb ?? 0) / (firmDetails?.storage_usage?.limit_gb ?? 1) * 100))}%`
                                        }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-xs text-[#64748B]">
                                    <span>{firmDetails?.storage_usage?.percent_used ?? 0}% used</span>
                                    <span>{(firmDetails?.storage_usage?.limit_gb ?? 0) - (firmDetails?.storage_usage?.used_gb ?? 0)}GB remaining</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[{
                            title: 'Total Invoices',
                            value: metrics.total_invoices ?? '—'
                        }, {
                            title: 'Outstanding Balance',
                            value: metrics.outstanding_balance_display || formatCurrency(metrics.outstanding_balance)
                        }, {
                            title: 'Total Paid Amount',
                            value: metrics.total_paid_amount_display || formatCurrency(metrics.total_paid_amount)
                        }, {
                            title: 'Total Revenue',
                            value: firmDetails?.total_revenue ? formatCurrency(firmDetails.total_revenue) : '$0.00'
                        }].map(({ title, value }) => (
                            <div key={title} className="rounded-xl border border-[#EFF4FF] bg-[#F9FBFF] p-4">
                                <p className="text-xs font-medium uppercase tracking-wide text-[#94A3B8]">{title}</p>
                                <p className="mt-1 text-lg font-semibold text-[#1F2937]">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>


            </div>

            <div className="rounded-xl bg-white p-6">
                <div className="mb-4">
                    <h5 className="text-lg font-semibold text-[#1E293B]">Subscription History</h5>
                    <p className="text-sm text-[#64748B]">{historyCount} records</p>
                </div>
                <div className="mt-6 overflow-x-auto">
                    <div className="min-w-[640px] rounded-2xl border border-[#EFF4FF] bg-[#F9FBFF]">
                        <div className="grid grid-cols-12 gap-3 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                            <span className="col-span-2">Invoice #</span>
                            <span className="col-span-3">Plan</span>
                            <span className="col-span-3">Billing Period</span>
                            <span className="col-span-2 text-right">Amount</span>
                            <span className="col-span-2">Status</span>
                        </div>
                        <div className="space-y-2 px-4 pb-4">
                            {history.length > 0 ? history.map(entry => {
                                const planLabel = entry.plan || entry.plan_label || entry.plan_display || '—';
                                const periodLabel = formatPeriod(entry.billing_period, entry);
                                const amountLabel = entry.formatted_amount || entry.amount_formatted || entry.total_paid_formatted || formatCurrency(entry.amount ?? entry.total_paid ?? entry.total);
                                const statusLabel = entry.status_display || entry.status_label || entry.status || '—';
                                const statusClasses = getStatusClasses(entry.status_color, statusLabel);

                                return (
                                    <div
                                        key={entry.invoice_id || entry.id || entry.invoice_number || `${planLabel}-${periodLabel}`}
                                        className="grid grid-cols-12 items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm"
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <span className="col-span-2 text-sm font-semibold text-[#1E293B]">{entry.invoice_number || entry.invoice_id || '—'}</span>
                                        <span className="col-span-3 text-sm font-semibold text-[#1E293B]">
                                            {planLabel}
                                            {entry.client?.name && (
                                                <span className="block text-xs font-medium text-[#94A3B8]">{entry.client.name}</span>
                                            )}
                                        </span>
                                        <span className="col-span-3 text-sm text-[#475569]">{periodLabel}</span>
                                        <span className="col-span-2 text-right text-sm font-semibold text-[#1E293B]">{amountLabel}</span>
                                        <span className="col-span-2">
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClasses}`}>
                                                {statusLabel}
                                            </span>
                                        </span>
                                    </div>
                                );
                            }) : (
                                <div className="rounded-lg border border-dashed border-[#E2E8F0] bg-white/60 px-6 py-8 text-center text-sm text-[#94A3B8]">
                                    No subscription history available.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};