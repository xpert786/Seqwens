import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { firmAdminSubscriptionAPI, handleAPIError } from '../../ClientOnboarding/utils/apiUtils';
import { getAccessToken } from '../../ClientOnboarding/utils/userUtils';

const SubscriptionStatusContext = createContext(null);

export const SubscriptionStatusProvider = ({ children }) => {
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSubscriptionStatus = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = getAccessToken();
            if (!token) {
                setLoading(false);
                return;
            }

            const result = await firmAdminSubscriptionAPI.getSubscriptionStatus();

            if (result.success && result.data) {
                setSubscriptionStatus(result.data);
            } else if (result.status) {
                // Handle direct status response
                setSubscriptionStatus(result);
            }
        } catch (err) {
            console.error('Error fetching subscription status:', err);
            setError(handleAPIError(err) || err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch on mount
    useEffect(() => {
        fetchSubscriptionStatus();
    }, [fetchSubscriptionStatus]);

    const refresh = useCallback(() => {
        fetchSubscriptionStatus();
    }, [fetchSubscriptionStatus]);

    const value = {
        subscriptionStatus,
        loading,
        error,
        refresh,
        // Computed convenience properties
        isTrialActive: subscriptionStatus?.is_trial || false,
        trialDaysRemaining: subscriptionStatus?.trial_days_remaining || 0,
        needsPayment: subscriptionStatus?.needs_payment || false,
        hasActiveSubscription: subscriptionStatus?.has_active_subscription || false,
        currentPlan: subscriptionStatus?.current_plan || null,
        status: subscriptionStatus?.status || 'unknown',
        statusDisplay: subscriptionStatus?.status_display || 'Unknown',
        message: subscriptionStatus?.message || '',
        ctaLabel: subscriptionStatus?.cta_label || null,
        ctaAction: subscriptionStatus?.cta_action || null,
    };

    return (
        <SubscriptionStatusContext.Provider value={value}>
            {children}
        </SubscriptionStatusContext.Provider>
    );
};

export const useSubscriptionStatus = () => {
    const context = useContext(SubscriptionStatusContext);
    if (!context) {
        // Return default values if used outside provider
        return {
            subscriptionStatus: null,
            loading: false,
            error: null,
            refresh: () => { },
            isTrialActive: false,
            trialDaysRemaining: 0,
            needsPayment: false,
            hasActiveSubscription: true,
            currentPlan: null,
            status: 'unknown',
            statusDisplay: 'Unknown',
            message: '',
            ctaLabel: null,
            ctaAction: null,
        };
    }
    return context;
};

export default SubscriptionStatusContext;
