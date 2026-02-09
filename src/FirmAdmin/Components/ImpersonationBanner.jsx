import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { performRevertToSuperAdmin, getImpersonationStatus } from '../../ClientOnboarding/utils/userUtils';
import { getPathWithPrefix } from '../../ClientOnboarding/utils/urlUtils';


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
            const { isImpersonating, info } = getImpersonationStatus();
            if (isImpersonating) {
                setImpersonationInfo(info || { firmName: 'Firm Account' });
                document.body.classList.add('is-impersonating');
            } else {
                setImpersonationInfo(null);
                document.body.classList.remove('is-impersonating');
            }
        };

        // Check initially
        checkImpersonation();

        // Also check periodically in case something changes
        const interval = setInterval(checkImpersonation, 3000);

        return () => {
            clearInterval(interval);
            document.body.classList.remove('is-impersonating');
        };
    }, []);

    const handleRevert = async () => {
        if (isReverting) return;

        try {
            setIsReverting(true);

            console.log('[IMPERSONATION_BANNER] Starting revert from banner');
            const success = performRevertToSuperAdmin();

            if (success) {
                toast.success("Successfully reverted to Super Admin account", {
                    position: "top-right",
                    autoClose: 2000,
                });

                // STEP 5: Force hard navigation to Super Admin dashboard
                console.log('[IMPERSONATION_BANNER] Step 5: Forcing navigation to Super Admin dashboard');
                setTimeout(() => {
                    const targetUrl = getPathWithPrefix('/superadmin');
                    console.log('[IMPERSONATION_BANNER] Navigating to:', targetUrl);
                    window.location.href = targetUrl;
                }, 500);
            } else {
                toast.error("Unable to revert: Original session data not found", {
                    position: "top-right",
                    autoClose: 3000,
                });
                setIsReverting(false);
            }

        } catch (error) {
            console.error("[IMPERSONATION_BANNER] Error during revert:", error);
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
        <div className="fixed top-0 left-0 right-0 z-[10000] bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg overflow-hidden" style={{ height: '40px' }}>
            <div className="h-full px-4 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-white/20 rounded-full">
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
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="font-bold text-sm">
                            IMPERSONATING:
                        </span>
                        <span className="text-sm border-l border-white/30 pl-2">
                            {impersonationInfo.firmName}
                        </span>
                        <span className="hidden md:inline text-xs opacity-75 italic ml-2">
                            (You are viewing this account as Super Admin)
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleRevert}
                    disabled={isReverting}
                    className="flex-shrink-0 px-3 py-1 bg-white text-orange-600 rounded-md font-bold text-xs hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isReverting ? (
                        <>
                            <div className="w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                            REVERTING...
                        </>
                    ) : (
                        <>
                            <svg
                                className="w-3 h-3"
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
                            REVERT TO SUPER ADMIN
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ImpersonationBanner;
