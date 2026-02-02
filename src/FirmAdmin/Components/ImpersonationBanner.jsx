import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { clearUserData, setTokens } from '../../ClientOnboarding/utils/userUtils';

/**
 * ImpersonationBanner - Shows a persistent banner when Super Admin is impersonating a firm
 * This helps make it visually clear that you're in an impersonation session
 */
const ImpersonationBanner = () => {
    const [impersonationInfo, setImpersonationInfo] = useState(null);
    const [isReverting, setIsReverting] = useState(false);

    useEffect(() => {
        // Check if we're in an impersonation session
        const checkImpersonation = () => {
            try {
                const impersonationDataStr = sessionStorage.getItem('impersonationInfo');
                if (impersonationDataStr) {
                    const data = JSON.parse(impersonationDataStr);
                    setImpersonationInfo(data);

                    console.log('[IMPERSONATION_BANNER] Active impersonation detected', {
                        firmName: data.firmName,
                        firmId: data.firmId,
                        impersonatedAt: data.impersonatedAt,
                    });
                } else {
                    setImpersonationInfo(null);
                }
            } catch (error) {
                console.error('[IMPERSONATION_BANNER] Error checking impersonation status:', error);
                setImpersonationInfo(null);
            }
        };

        // Check initially
        checkImpersonation();

        // Also check periodically in case something changes
        const interval = setInterval(checkImpersonation, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleRevert = async () => {
        if (isReverting) return;

        try {
            setIsReverting(true);

            console.log('[IMPERSONATION_BANNER] Starting revert from banner');

            // Get stored Super Admin session data
            const impersonationDataStr = sessionStorage.getItem('superAdminImpersonationData');
            if (!impersonationDataStr) {
                console.error('[IMPERSONATION_BANNER] Original session data not found');
                toast.error("Unable to revert: Original session data not found", {
                    position: "top-right",
                    autoClose: 3000,
                });
                setIsReverting(false);
                return;
            }

            const sessionData = JSON.parse(impersonationDataStr);

            console.log('[IMPERSONATION_BANNER] Retrieved session data');

            // STEP 1: Hard reset - Clear ALL current context
            console.log('[IMPERSONATION_BANNER] Step 1: Clearing all current context');
            clearUserData();

            // Additional explicit clearing of impersonation-specific data
            localStorage.removeItem('firmLoginData');
            sessionStorage.removeItem('firmLoginData');

            // STEP 2: Restore Super Admin session data
            console.log('[IMPERSONATION_BANNER] Step 2: Restoring Super Admin session');

            // Clear everything first to ensure clean slate
            localStorage.clear();
            sessionStorage.clear();

            // Restore only Super Admin data
            if (sessionData.accessToken) {
                localStorage.setItem('accessToken', sessionData.accessToken);
            }
            if (sessionData.refreshToken) {
                localStorage.setItem('refreshToken', sessionData.refreshToken);
            }
            if (sessionData.userData) {
                localStorage.setItem('userData', sessionData.userData);
            }
            if (sessionData.userType) {
                localStorage.setItem('userType', sessionData.userType);
            }
            if (sessionData.isLoggedIn) {
                localStorage.setItem('isLoggedIn', sessionData.isLoggedIn);
            }
            if (sessionData.rememberMe) {
                localStorage.setItem('rememberMe', sessionData.rememberMe);
            }

            // Restore session storage data
            if (sessionData.sessionAccessToken) {
                sessionStorage.setItem('accessToken', sessionData.sessionAccessToken);
            }
            if (sessionData.sessionRefreshToken) {
                sessionStorage.setItem('refreshToken', sessionData.sessionRefreshToken);
            }
            if (sessionData.sessionUserData) {
                sessionStorage.setItem('userData', sessionData.sessionUserData);
            }
            if (sessionData.sessionUserType) {
                sessionStorage.setItem('userType', sessionData.sessionUserType);
            }
            if (sessionData.sessionIsLoggedIn) {
                sessionStorage.setItem('isLoggedIn', sessionData.sessionIsLoggedIn);
            }
            if (sessionData.sessionRememberMe) {
                sessionStorage.setItem('rememberMe', sessionData.sessionRememberMe);
            }

            // STEP 3: Clear impersonation data (must be after restore)
            console.log('[IMPERSONATION_BANNER] Step 3: Clearing impersonation markers');
            sessionStorage.removeItem('superAdminImpersonationData');
            sessionStorage.removeItem('impersonationInfo');

            // STEP 4: Set tokens properly using utility
            console.log('[IMPERSONATION_BANNER] Step 4: Setting tokens');
            if (sessionData.accessToken && sessionData.refreshToken) {
                setTokens(sessionData.accessToken, sessionData.refreshToken, false);
            }

            console.log('[IMPERSONATION_BANNER] Revert complete');

            toast.success("Successfully reverted to Super Admin account", {
                position: "top-right",
                autoClose: 2000,
            });

            // STEP 5: Force hard navigation to Super Admin dashboard
            console.log('[IMPERSONATION_BANNER] Step 5: Forcing navigation to Super Admin dashboard');
            setTimeout(() => {
                const targetUrl = '/seqwens-frontend/superadmin';
                console.log('[IMPERSONATION_BANNER] Navigating to:', targetUrl);
                window.location.href = targetUrl;
            }, 500);

        } catch (error) {
            console.error("[IMPERSONATION_BANNER] Error during revert:", error);
            console.error("[IMPERSONATION_BANNER] Error stack:", error.stack);

            toast.error("Failed to revert to Super Admin account. Please refresh the page and try again.", {
                position: "top-right",
                autoClose: 5000,
            });
            setIsReverting(false);
        }
    };

    if (!impersonationInfo) {
        return null; // Don't show banner if not impersonating
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
            <div className="container mx-auto px-4 py-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                            </svg>
                        </div>
                        <div>
                            <div className="font-semibold text-sm">
                                🔒 Impersonating: {impersonationInfo.firmName}
                            </div>
                            <div className="text-xs opacity-90">
                                You are viewing this firm as a Super Admin. Changes you make will affect this firm.
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleRevert}
                        disabled={isReverting}
                        className="px-4 py-2 bg-white text-orange-600 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isReverting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                                Reverting...
                            </>
                        ) : (
                            <>
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                    />
                                </svg>
                                Revert to Super Admin
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImpersonationBanner;
