// Summary of changes made to FirmDetails.jsx:
// 1. Added 'enablingDevMode' state variable to track developer subscription toggle loading state
// 2. Added 'handleToggleDevMode' function to enable/disable developer subscription via API
// 3. Pass 'handleToggleDevMode' and 'enablingDevMode' as props to BillingOverviewTab component
// 4. Updated BillingOverviewTab to accept these new props and display developer subscription button when no subscription is present
// 5. Added UI in Billing tab to show a prominent button for enabling/disabling developer subscription for QA testing

/** 
 * Instructions for implementation:
 * 
 * 1. In FirmDetails component (around line 62), add:
 *    const [enablingDevMode, setEnablingDevMode] = useState(false);
 * 
 * 2. After the handleFirmLogin function (around line 507), add the handleToggleDevMode function 
 *    (see the complete function in this file)
 * 
 * 3. When rendering BillingOverviewTab (around line 810), add two new props:
 *    handleToggleDevMode={handleToggleDevMode}
 *    enablingDevMode={enablingDevMode}
 * 
 * 4. In BillingOverviewTab function signature (around line 1004), add these two new parameters:
 *    handleToggleDevMode,
 *    enablingDevMode
 * 
 * 5. In BillingOverviewTab return statement, after the div containing status_display (around line 1130),
 *    add the Developer Subscription button section (see complete JSX in this file)
 */

// COMPLETE handleToggleDevMode FUNCTION TO ADD:
const handleToggleDevMode = async () => {
    if (!firmId || !firm Details) return;

    try {
        setEnablingDevMode(true);
        
        const newValue = !firmDetails.is_billing_bypass;
        const response = await superAdminAPI.updateFirmSettings(firmId, {
            is_billing_bypass: newValue
        });

        if (response.success && response.data) {
            setFirmDetails(prev =>${
                ...prev,
                is_billing_bypass: newValue
            });
            
            toast.success(
                newValue 
                    ? 'Developer Subscription enabled. Firm has full access for QA testing.' 
                    : 'Developer Subscription disabled.',
                {
                    position: "top-right",
                    autoClose: 3000,
                }
            );
            
            // Refresh firm details to get updated billing status
            await fetchFirmDetails();
        } else {
            throw new Error(response.message || 'Failed to update developer subscription');
        }
    } catch (err) {
        console.error('Error toggling developer subscription:', err);
        toast.error(handleAPIError(err), {
            position: "top-right",
            autoClose: 3000,
        });
    } finally {
        setEnablingDevMode(false);
    }
};


// DEVELOPER SUBSCRIPTION UI TO ADD IN BillingOverviewTab (after line 1130 in BillingOverviewTab):
/*
{(!firmDetails?.subscription_plan || firmDetails?.subscription_plan === 'None') && (
    <div className="mb-6 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 dark:bg-blue-900/20 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600 dark:text-blue-400">
                        <path d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2ZM10 16.5C6.41015 16.5 3.5 13.5899 3.5 10C3.5 6.41015 6.41015 3.5 10 3.5C13.5899 3.5 16.5 6.41015 16.5 10C16.5 13.5899 13.5899 16.5 10 16.5Z" fill="currentColor"/>
                        <path d="M13.5 7L15.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M17 10H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <h6 className="text-base font-semibold text-blue-900 dark:text-blue-200">
                        {firmDetails?.is_billing_bypass ? 'Developer Subscription Active' : 'Enable QA Testing Mode'}
                    </h6>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    {firmDetails?.is_billing_bypass 
                        ? 'This firm has full access to all features for QA testing purposes. No subscription required.'
                        : 'Enable Developer Subscription to grant full access to all features for QA testing purposes.'}
                </p>
            </div>
            <button
                type="button"
                onClick={() => {
                    if (window.confirm(
                        firmDetails?.is_billing_bypass
                            ? 'Disable Developer Subscription? This firm will lose access to features unless they have a paid subscription.'
                            : 'Enable Developer Subscription? This firm will have full access to all features for QA testing.'
                    )) {
                        handleToggleDevMode?.();
                    }
                }}
                disabled={enablingDevMode}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    firmDetails?.is_billing_bypass
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                style={{ borderRadius: '8px' }}
            >
                {enablingDevMode ? (
                    <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-white"></div>
                        {firmDetails?.is_billing_bypass ? 'Disabling...' : 'Enabling...'}
                    </>
                ) : (
                    <>
                        {firmDetails?.is_billing_bypass ? (
                            <>
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Disable Developer Mode
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z" stroke="currentColor" strokeWidth="1.5"/>
                                    <path d="M10 7V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    <path d="M7 10H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                                Enable Developer Subscription
                            </>
                        )}
                    </>
                )}
            </button>
        </div>
    </div>
)}
*/
