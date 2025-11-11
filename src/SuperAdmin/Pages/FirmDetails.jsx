import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { superAdminAPI, handleAPIError } from '../utils/superAdminAPI';

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
    const [activeTab, setActiveTab] = useState('Overview');
    const [firmDetails, setFirmDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const stats = useMemo(() => {
        return {
            users: firmDetails?.staff_count ?? 0,
            clients: firmDetails?.client_count ?? 0,
            revenue: formatCurrency(firmDetails?.monthly_fee ?? 0)
        };
    }, [firmDetails]);

    const systemHealth = useMemo(() => {
        return {
            overall: firmDetails?.system_health?.overall || 0.91,
            storageUsed: firmDetails?.system_health?.storageUsed || 48,
            storageCapacity: firmDetails?.system_health?.storageCapacity || 200,
            lastActive: firmDetails?.last_active || '2 hours ago'
        };
    }, [firmDetails]);

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
                subtitle: 'Staff members with access',
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

    const tabs = [
        { id: 'Overview', label: 'Overview' },
        { id: 'Billing', label: 'Billing' },
        { id: 'Settings', label: 'Settings' }
    ];

    const firmName = firmDetails?.name || 'Firm Details';
    const firmOwner = firmDetails?.admin_user_name || 'Not provided';
    const firmEmail = firmDetails?.admin_user_email || 'Not provided';
    const firmPhone = firmDetails?.phone_number || 'Not provided';
    const firmTaxId = firmDetails?.tax_id || 'Not provided';
    const firmJoinDate = firmDetails?.created_at || firmDetails?.joined_at;

    const billingInfo = useMemo(() => {
        return {
            plan: firmDetails?.subscription_plan
                ? firmDetails.subscription_plan.charAt(0).toUpperCase() + firmDetails.subscription_plan.slice(1)
                : 'Professional',
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
                plan: entry.plan || 'Professional Plan',
                period: entry.billing_period || entry.period || 'Not available',
                amount: formatCurrency(entry.amount ?? entry.total ?? 0),
                status: entry.status
                    ? entry.status.charAt(0).toUpperCase() + entry.status.slice(1)
                    : 'Completed'
            }));
        }

        return [
            {
                id: 'current',
                plan: billingInfo.plan,
                period: 'Oct 15, 2025 – Nov 15, 2025',
                amount: billingInfo.monthlyCost,
                status: billingInfo.status
            },
            {
                id: 'basic',
                plan: 'Basic Plan',
                period: 'Oct 1, 2025 – Oct 31, 2025',
                amount: '$29.99',
                status: 'Completed'
            },
            {
                id: 'premium',
                plan: 'Premium Plan',
                period: 'Nov 1, 2025 – Dec 1, 2025',
                amount: '$99.99',
                status: 'Completed'
            },
            {
                id: 'student',
                plan: 'Student Plan',
                period: 'Sep 15, 2025 – Oct 15, 2025',
                amount: '$19.99',
                status: 'Completed'
            }
        ];
    }, [billingInfo, firmDetails]);

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
        <div className="min-h-screen bg-[rgb(243,247,255)] px-4 py-6 md:px-6">
            <div className="mx-auto flex w-full flex-col gap-6">
                <div className="flex flex-col items-start justify-between gap-3 rounded-2xl px-6 py-3 sm:flex-row sm:items-center">
                    <div className="space-y-1">
                        <h3 className="text-3xl font-bold text-gray-900">{firmName || 'Firm Details'}</h3>
                        <p className="text-sm text-gray-500">Manage all firms registered on the platform</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            style={{ borderRadius: '8px' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25" stroke="#4B5563" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12.75 6.5L9 2.75M9 2.75L5.25 6.5M9 2.75V11.75" stroke="#4B5563" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Import Report
                        </button>
                        <button
                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            style={{ borderRadius: '8px' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25M5.25 7.5L9 11.25M9 11.25L12.75 7.5M9 11.25V2.25" stroke="#4B5563" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Export Report
                        </button>
                        <button
                            // onClick={handleAddFirm}
                            className="flex items-center gap-2 rounded-lg bg-[#F56D2D] px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
                            style={{ borderRadius: '8px' }}
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Firm
                        </button>
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
                        <div className="rounded-lg bg-white px-4 py-2">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2 p-2">
                                        {tabs.map((tab) => {
                                            const isActive = activeTab === tab.id;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    type="button"
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={`px-5 py-2 text-sm font-medium transition-colors ${isActive
                                                        ? 'bg-[#3B4A66] text-white'
                                                        : 'bg-white text-black hover:bg-[#DDE5FF]'
                                                        }`}
                                                    style={{ borderRadius: '8px' }}
                                                >
                                                    {tab.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {activeTab === 'Overview' && (
                            <>
                                <div className="grid gap-4 md:grid-cols-3">
                                    {statCards.map(({ id, label, value, subtitle, icon }) => (
                                        <div
                                            key={id}
                                            className="flex flex-col gap-2 rounded-xl bg-white p-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                                                    {label}
                                                </p>
                                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F7FB]">
                                                    {icon}
                                                </span>
                                            </div>
                                            <p className="text-2xl font-semibold text-[#0F172A]">{value}</p>
                                            <p className="text-xs text-[#94A3B8]">{subtitle}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid gap-4 lg:grid-cols-2 xl:gap-6">
                                    <div className="rounded-xl bg-white/90 p-6 ">
                                        <h5 className="text-lg font-medium text-grey-600">Firm Information</h5>
                                        <div className="mt-6 space-y-4 text-sm">
                                            {[
                                                { label: 'Owner:', value: firmOwner },
                                                { label: 'Email:', value: firmEmail },
                                                { label: 'Phone:', value: firmPhone },
                                                { label: 'Tax ID:', value: firmTaxId },
                                                { label: 'Join Date:', value: formatDate(firmJoinDate) },
                                                {
                                                    label: 'Plan:',
                                                    value: firmDetails?.subscription_plan
                                                        ? firmDetails.subscription_plan.charAt(0).toUpperCase() +
                                                        firmDetails.subscription_plan.slice(1)
                                                        : 'Not specified'
                                                }
                                            ].map(({ label, value }) => (
                                                <div
                                                    key={label}
                                                    className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <span className="text-sm font-medium text-[#64748B] sm:text-base">{label}</span>
                                                    <span className="text-sm font-semibold text-grey-600 sm:text-right sm:text-base">
                                                        {value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-xl bg-white/90 p-6 ">
                                        <h5 className="text-lg font-semibold text-[#1E293B]">System Health</h5>
                                        <div className="mt-6 space-y-6">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs font-medium text-[#475569]">
                                                    <span>Overall Health</span>
                                                    <span>{Math.round(systemHealth.overall * 100)}%</span>
                                                </div>
                                                <div className="h-2.5 w-full rounded-full bg-[#EEF4FF]">
                                                    <div
                                                        className="h-full rounded-full bg-[#3B4A66]"
                                                        style={{ width: `${Math.min(100, Math.round(systemHealth.overall * 100))}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs font-medium text-[#475569]">
                                                    <span>Storage Used</span>
                                                    <span>
                                                        {systemHealth.storageUsed}GB / {systemHealth.storageCapacity}GB
                                                    </span>
                                                </div>
                                                <div className="h-2.5 w-full rounded-full bg-[#EEF4FF]">
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
                                            <div className="flex items-center gap-2 text-xs font-medium text-[#475569]">
                                                <svg width="14" height="14" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M11.3333 0.5L6.72917 5.10417L4.02083 2.39583L0.5 5.91667" stroke="#22C55E" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Last active:{' '}
                                                <span className="font-semibold text-[#1F2937]">
                                                    {systemHealth.lastActive || 'Recently'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'Billing' && (
                            <div className="flex flex-col gap-6">
                                <div className="grid gap-6 lg:grid-cols-2">
                                    <div className="rounded-xl  bg-white p-6 ">
                                        <div className="flex flex-col gap-1">
                                            <h5 className="text-lg font-semibold text-[#1E293B]">Current Subscription</h5>
                                            <p className="text-sm text-[#64748B]">
                                                Manage, upgrade, and track your active plans effortlessly — stay in control of every subscription.
                                            </p>
                                        </div>
                                        <div className="mt-6 divide-y divide-[#EFF4FF] rounded-xl">
                                            {[
                                                { label: 'Plan', value: billingInfo.plan, isBadge: true },
                                                { label: 'Monthly Cost', value: billingInfo.monthlyCost },
                                                { label: 'Next Billing', value: billingInfo.nextBilling },
                                                { label: 'Status', value: billingInfo.status, status: billingInfo.status }
                                            ].map(({ label, value, isBadge, status }) => (
                                                <div
                                                    key={label}
                                                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <span className="text-sm font-medium text-[#475569]">{label}</span>
                                                    {isBadge ? (
                                                        <span className="inline-flex items-center rounded-full bg-[#EFF4FF] px-3 py-1 text-xs font-semibold text-[#1E3A8A]">
                                                            {value}
                                                        </span>
                                                    ) : status ? (
                                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status.toLowerCase() === 'active'
                                                            ? 'bg-green-500 text-[#FFFFFF]'
                                                            : 'bg-[#E2E8F0] text-[#475569]'
                                                            }`}>
                                                            {value}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm font-semibold text-[#0F172A]">{value}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-xl bg-white p-6">
                                        <h5 className="text-lg font-semibold text-[#1E293B]">Quick Actions</h5>
                                        <p className="mt-1 text-sm text-[#64748B]">Common administrative tasks</p>
                                        <div className="mt-5 flex flex-col divide-y divide-[#EFF4FF] ">
                                            {quickActions.map(({ id, label, icon }) => (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    className="flex items-center justify-between px-4 py-3 text-sm font-medium text-[#1F2937] transition-colors hover:bg-white"
                                                >
                                                    <span className="flex items-center gap-3">
                                                        <span className="flex h-8 w-8 items-center justify-center bg-white text-[#3B4A66]">
                                                            {icon}

                                                        </span>
                                                        {label}
                                                    </span>

                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl bg-white p-6">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <h5 className="text-lg font-semibold text-[#003F8F] " style={{ color: '#003F8F' }}>Subscription History</h5>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-2 rounded-lg bg-[#F56D2D] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                                            style={{ borderRadius: '8px' }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M0.75 9.378V10.125C0.75 10.7217 0.987053 11.294 1.40901 11.716C1.83097 12.1379 2.40326 12.375 3 12.375H10.5C11.0967 12.375 11.669 12.1379 12.091 11.716C12.5129 11.294 12.75 10.7217 12.75 10.125V9.375M6.75 0.75V9M6.75 9L9.375 6.375M6.75 9L4.125 6.375" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>

                                            Export All Invoices
                                        </button>
                                    </div>
                                    <div className="mt-6 overflow-x-auto">
                                        <div className="min-w-[640px] rounded-2xl border border-[#EFF4FF] bg-[#F9FBFF]">
                                            <div className="grid grid-cols-12 gap-3 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                                                <span className="col-span-3">Plan</span>
                                                <span className="col-span-3">Billing Period</span>
                                                <span className="col-span-2">Amount</span>
                                                <span className="col-span-2">Status</span>
                                                <span className="col-span-2 text-right">Invoice</span>
                                            </div>
                                            <div className="space-y-2 px-4 pb-4">
                                                {subscriptionHistory.map(({ id, plan, period, amount, status }) => (
                                                    <div
                                                        key={id}
                                                        className="grid grid-cols-12 items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm"
                                                        style={{ borderRadius: '8px', color: '#003F8F' }}
                                                    >
                                                        <span className="col-span-3 text-sm font-semibold] ">{plan}</span>
                                                        <span className="col-span-3 text-sm font-semibold">{period}</span>
                                                        <span className="col-span-2 text-sm font-semibold ">{amount}</span>
                                                        <span className="col-span-2">
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status.toLowerCase() === 'active'
                                                                    ? 'bg-[#DCFCE7] text-[#166534]'
                                                                    : 'bg-[#E2E8F0] text-[#475569]'
                                                                    }`}
                                                            >
                                                                {status}
                                                            </span>
                                                        </span>
                                                        <span className="col-span-2 flex items-center justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                className="flex h-8 w-8 items-center justify-center rounded-full  bg-[#F3F7FF] text-[#475569] hover:bg-[#F8FAFC]"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <path d="M1.33301 8C1.33301 8 3.33301 3.33334 7.99967 3.33334C12.6663 3.33334 14.6663 8 14.6663 8C14.6663 8 12.6663 12.6667 7.99967 12.6667C3.33301 12.6667 1.33301 8 1.33301 8Z" stroke="#475569" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                                                    <path d="M8.00033 9.66666C8.92081 9.66666 9.667 8.92048 9.667 8C9.667 7.07952 8.92081 6.33334 8.00033 6.33334C7.07986 6.33334 6.33368 7.07952 6.33368 8C6.33368 8.92048 7.07986 9.66666 8.00033 9.66666Z" stroke="#475569" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="flex h-8 w-8 items-center justify-center rounded-full  bg-[#F3F7FF] text-[#475569] hover:bg-[#F8FAFC]"
                                                            >
                                                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <path d="M14 9.5V12.5C14 12.8978 13.842 13.2794 13.5607 13.5607C13.2794 13.842 12.8978 14 12.5 14H2C1.60218 14 1.22064 13.842 0.93934 13.5607C0.658035 13.2794 0.5 12.8978 0.5 12.5V9.5M3.5 5.75L7.25 9.5M7.25 9.5L11 5.75M7.25 9.5V0.5" stroke="#4B5563" stroke-linecap="round" stroke-linejoin="round" />
                                                                </svg>

                                                            </button>
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Settings' && (
                            <div className="rounded-xl bg-white/95 p-6">
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h5 className="text-xl font-semibold text-[#1E293B]">Firm Settings</h5>
                                            <p className="mt-1 text-sm text-[#64748B]">
                                                Configure your firm details, manage users, and control system preferences all in one place.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F6F8FE] text-[#94A3B8] transition-colors hover:bg-[#EEF3FF] hover:text-[#475569]"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M3 3L9 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M9 3L3 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        {[
                                            {
                                                id: 'firmName',
                                                label: 'Firm Name',
                                                value: firmDetails?.name || 'Johnson & Associates CPA'
                                            },
                                            {
                                                id: 'phone',
                                                label: 'Phone Number',
                                                value: firmPhone || '+1 (555) 123-4567'
                                            },
                                            {
                                                id: 'email',
                                                label: 'Email Address',
                                                value: firmEmail || 'admin@johnsonassociates.com'
                                            },
                                            {
                                                id: 'address',
                                                label: 'Address',
                                                value: firmDetails?.address || '123 Main St, New York, NY 10001'
                                            }
                                        ].map(({ id, label, value }) => (
                                            <div key={id} className="flex flex-col gap-2">
                                                <label htmlFor={id} className="text-sm font-medium text-[#475569]">
                                                    {label}
                                                </label>
                                                <input
                                                    id={id}
                                                    name={id}
                                                    type="text"
                                                    value={value}
                                                    readOnly
                                                    className="w-full rounded-lg px-4 py-3 text-sm font-medium text-[#1F2937] shadow-inner focus:outline-none focus:ring-2 focus:ring-[#BFD4FF]"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2 text-sm font-semibold text-[#475569] transition-colors hover:bg-[#F8FAFC]"
                                            style={{ borderRadius: '8px' }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center rounded-lg px-5 py-2 text-sm font-semibold text-white bg-[#F56D2D] transition-colors hover:bg-orange-600"
                                            style={{ borderRadius: '8px' }}
                                        >
                                            Create Firm
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

