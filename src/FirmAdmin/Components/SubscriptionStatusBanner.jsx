import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStatus } from '../Context/SubscriptionStatusContext';

/**
 * SubscriptionStatusBanner - Displays a banner showing the current subscription state
 * This banner appears below the header for trial, pending payment, or other actionable states
 */
const SubscriptionStatusBanner = () => {
    const navigate = useNavigate();
    const {
        loading,
        status,
        statusDisplay,
        message,
        ctaLabel,
        ctaAction,
        isTrialActive,
        trialDaysRemaining,
        needsPayment,
        hasActiveSubscription,
        currentPlan,
    } = useSubscriptionStatus();

    // Don't show banner while loading
    if (loading) {
        return null;
    }

    // Don't show banner for fully active subscriptions with no issues
    if (status === 'active' && !needsPayment && !isTrialActive) {
        return null;
    }



    // Determine banner style based on status
    const getBannerStyle = () => {
        switch (status) {
            case 'trial':
                if (trialDaysRemaining <= 3) {
                    return {
                        bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
                        text: 'text-white',
                        icon: '⏰',
                    };
                }
                return {
                    bg: 'bg-gradient-to-r from-cyan-500 to-blue-500',
                    text: 'text-white',
                    icon: '🎉',
                };
            case 'pending_payment':
                return {
                    bg: 'bg-gradient-to-r from-yellow-400 to-amber-500',
                    text: 'text-gray-900',
                    icon: '⚠️',
                };
            case 'expired':
                return {
                    bg: 'bg-gradient-to-r from-red-500 to-rose-600',
                    text: 'text-white',
                    icon: '🔴',
                };
            case 'active_cancelling':
                return {
                    bg: 'bg-gradient-to-r from-orange-400 to-amber-500',
                    text: 'text-white',
                    icon: '📅',
                };
            case 'inactive':
                return {
                    bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
                    text: 'text-white',
                    icon: '🔒',
                };
            default:
                return null;
        }
    };

    const bannerStyle = getBannerStyle();

    // If no banner style (hidden status), return null
    if (!bannerStyle) {
        return null;
    }

    const handleCtaClick = () => {
        switch (ctaAction) {
            case 'resume_checkout':
            case 'upgrade':
            case 'renew':
            case 'select_plan':
                navigate('/firmadmin/subscription');
                break;
            case 'manage':
                navigate('/firmadmin/subscription');
                break;
            case 'reactivate':
                navigate('/firmadmin/subscription');
                break;
            default:
                navigate('/firmadmin/subscription');
        }
    };

    return (
        <div
            className={`${bannerStyle.bg} ${bannerStyle.text} py-2.5 px-4 shadow-sm`}
            style={{
                position: 'relative',
                zIndex: 1019,
            }}
        >
            <div className="container-fluid">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                        <span className="text-lg">{bannerStyle.icon}</span>
                        <div>
                            <span className="fw-semibold me-2" style={{ fontSize: '14px' }}>
                                {currentPlan && status !== 'inactive' ? `${currentPlan} Plan` : ''}
                                {status === 'trial' && ` • ${statusDisplay}`}
                                {status === 'pending_payment' && ` • ${statusDisplay}`}
                                {status === 'expired' && ` • ${statusDisplay}`}
                                {status === 'active_cancelling' && ` • ${statusDisplay}`}
                                {status === 'inactive' && statusDisplay}
                            </span>
                            <span style={{ fontSize: '13px', opacity: 0.95 }}>
                                {message}
                            </span>
                        </div>
                    </div>

                    {ctaLabel && (
                        <button
                            onClick={handleCtaClick}
                            className={`btn  fw-semibold px-3 py-1.5 rounded-pill shadow-sm ${status === 'pending_payment'
                                ? 'btn-dark'
                                : 'btn-light'
                                }`}
                            style={{
                                fontSize: '13px',
                                minWidth: '120px',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.02)';
                                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                            }}
                        >
                            {ctaLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubscriptionStatusBanner;
