import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import RoleSelectionModal from '../components/RoleSelectionModal';
import FirmSelectionModal from '../components/FirmSelectionModal';
import FixedLayout from '../ClientOnboarding/components/FixedLayout';
import { userAPI } from '../ClientOnboarding/utils/apiUtils';
import { setTokens } from '../ClientOnboarding/utils/userUtils';

// Role categories for strict filtering
const FIRM_ROLES = new Set([
    'firm', 'admin', 'FirmAdmin', 'firmadmin', 'firm_admin',
    'staff', 'tax_preparer', 'TeamMember', 'team_member', 'teammember',
    'accountant', 'bookkeeper', 'assistant', 'preparer',
]);

const TAXPAYER_ROLES = new Set([
    'client', 'taxpayer', 'Taxpayer', 'Client',
]);

/**
 * Determines which "login category" a role belongs to.
 * Returns: 'firm' | 'taxpayer' | 'other'
 */
function getRoleCategory(roleValue) {
    if (!roleValue) return 'other';
    const lower = String(roleValue).toLowerCase().trim();
    if (
        FIRM_ROLES.has(lower) ||
        ['firm', 'admin', 'firmadmin', 'firm_admin', 'staff', 'tax_preparer',
            'team_member', 'teammember', 'accountant', 'bookkeeper', 'assistant', 'preparer'].includes(lower)
    ) {
        return 'firm';
    }
    if (TAXPAYER_ROLES.has(lower) || ['client', 'taxpayer'].includes(lower)) {
        return 'taxpayer';
    }
    return 'other';
}

/**
 * Filter firm memberships strictly based on login category.
 */
function filterFirmsForCategory(allFirms, loginCategory) {
    if (!allFirms || allFirms.length === 0) return [];
    if (loginCategory === 'firm') {
        return allFirms.filter(f => getRoleCategory(f.role) === 'firm');
    }
    if (loginCategory === 'taxpayer') {
        return allFirms.filter(f => getRoleCategory(f.role) === 'taxpayer');
    }
    return allFirms;
}

export default function SelectContext() {
    const location = useLocation();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState('role'); // 'role' or 'firm'
    const [selectedLoginCategory, setSelectedLoginCategory] = useState(null);

    // Dynamic context — populated from navigation state or fetched fresh after invite acceptance
    const [fetchedContext, setFetchedContext] = useState(null);
    const [isFetchingContext, setIsFetchingContext] = useState(false);

    const stateData = location.state || {};
    const {
        needs_role_selection: stateNeedsRoleSelection,
        needs_firm_selection: stateNeedsFirmSelection,
        all_roles: stateAllRoles,
        all_firms: stateAllFirms,
        user: stateUser,
        fromInvitation,
    } = stateData;

    // Resolve data — prefer fetched (post-invite) over state (post-login)
    const needs_role_selection = fetchedContext?.needs_role_selection ?? stateNeedsRoleSelection;
    const needs_firm_selection = fetchedContext?.needs_firm_selection ?? stateNeedsFirmSelection;
    const all_roles = fetchedContext?.all_roles ?? stateAllRoles;
    const all_firms = fetchedContext?.all_firms ?? stateAllFirms;
    const user = fetchedContext?.user ?? stateUser;

    // Step 1: If arriving from an invite acceptance without pre-populated firms,
    // fetch fresh context data from the API so the newly-linked membership is included.
    useEffect(() => {
        if (!location.state) {
            navigate('/login', { replace: true });
            return;
        }

        if (fromInvitation && !stateAllFirms) {
            setIsFetchingContext(true);
            userAPI.getAvailableContexts()
                .then((response) => {
                    if (response.success && response.data) {
                        setFetchedContext({
                            needs_role_selection: response.data.needs_role_selection,
                            needs_firm_selection: response.data.needs_firm_selection,
                            all_roles: response.data.all_roles,
                            all_firms: response.data.all_firms,
                            user: stateUser,
                        });
                    }
                })
                .catch((err) => {
                    console.error('SelectContext: failed to fetch fresh contexts after invite:', err);
                })
                .finally(() => setIsFetchingContext(false));
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Step 2: Once we have resolved data, determine routing / initial step
    useEffect(() => {
        if (isFetchingContext) return;
        if (!location.state) return;
        // Skip until data is actually available (e.g., after the async fetch above)
        if (fromInvitation && !stateAllFirms && !fetchedContext) return;

        if (!needs_role_selection && needs_firm_selection) {
            const initialCategory = getRoleCategory(
                user?.active_role || user?.user_type || user?.role?.[0] || user?.role
            );
            setSelectedLoginCategory(initialCategory);

            const firmsForCat = filterFirmsForCategory(all_firms, initialCategory);
            if (firmsForCat.length === 1) {
                console.log('Skipping firm selection: only one membership available');
                autoSelectFirm(firmsForCat[0]);
                return;
            }
        }

        if (needs_role_selection) {
            setCurrentStep('role');
        } else if (needs_firm_selection) {
            setCurrentStep('firm');
        } else {
            redirectToDashboard(user);
        }
    }, [needs_role_selection, needs_firm_selection, all_firms, user, isFetchingContext, fetchedContext]);

    // Block the browser's back button while on this page.
    useEffect(() => {
        window.history.pushState(null, '', window.location.href);
        const handlePopState = () => {
            navigate('/login', { replace: true });
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [navigate]);

    const autoSelectFirm = async (firmData) => {
        try {
            const data = await userAPI.selectFirm(firmData.membership_id);
            if (data.success) {
                const rememberMe =
                    localStorage.getItem('rememberMe') === 'true' ||
                    sessionStorage.getItem('rememberMe') === 'true';
                setTokens(data.access_token, data.refresh_token, rememberMe);
                const storage = rememberMe ? localStorage : sessionStorage;
                storage.setItem('userData', JSON.stringify(data.user));
                storage.setItem('userType', data.user.active_role || data.user.user_type);
                redirectToDashboard(data.user);
            }
        } catch (err) {
            console.error('Auto-select firm error:', err);
            setCurrentStep('firm');
        }
    };

    const handleRoleSelected = (selectedUser, loginCategory) => {
        const category = loginCategory || getRoleCategory(
            selectedUser?.active_role || selectedUser?.user_type || selectedUser?.role?.[0] || selectedUser?.role
        );
        setSelectedLoginCategory(category);

        if (needs_firm_selection) {
            const applicableFirms = filterFirmsForCategory(all_firms, category);
            if (applicableFirms.length === 0) {
                console.log('No firm memberships for selected category, proceeding to dashboard directly.');
                redirectToDashboard(selectedUser);
            } else if (applicableFirms.length === 1) {
                autoSelectFirm(applicableFirms[0]);
            } else {
                setCurrentStep('firm');
            }
        } else {
            redirectToDashboard(selectedUser);
        }
    };

    const handleFirmSelected = (selectedUser) => {
        redirectToDashboard(selectedUser);
    };

    const redirectToDashboard = (userData) => {
        const storage = localStorage.getItem('rememberMe') === 'true' ? localStorage : sessionStorage;
        const userType = storage.getItem('userType') || userData?.user_type || userData?.active_role;

        if (userType === 'super_admin' || userType === 'support_admin' || userType === 'billing_admin') {
            navigate('/superadmin', { replace: true });
        } else if (userType === 'admin' || userType === 'firm') {
            navigate('/firmadmin', { replace: true });
        } else if (userType === 'tax_preparer') {
            navigate('/taxdashboard', { replace: true });
        } else if (userType === 'client' || userType === 'taxpayer') {
            navigate('/dashboard', { replace: true });
        } else {
            navigate('/dashboard', { replace: true });
        }
    };

    const filteredFirms = filterFirmsForCategory(all_firms, selectedLoginCategory);

    if (isFetchingContext) {
        return (
            <FixedLayout>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '60vh',
                    flexDirection: 'column',
                    gap: '12px',
                }}>
                    <div className="spinner-border" role="status" style={{ color: '#fff' }} />
                    <p style={{ color: '#fff', fontFamily: 'BasisGrotesquePro', fontSize: '16px', margin: 0 }}>
                        Loading your account contexts...
                    </p>
                </div>
            </FixedLayout>
        );
    }

    return (
        <FixedLayout>
            {currentStep === 'role' && all_roles && all_roles.length > 0 && (
                <RoleSelectionModal
                    roles={all_roles}
                    allFirms={all_firms}
                    onSelect={handleRoleSelected}
                />
            )}

            {currentStep === 'firm' && needs_firm_selection && (
                <FirmSelectionModal
                    firms={filteredFirms}
                    onSelect={handleFirmSelected}
                    loginCategory={selectedLoginCategory}
                    onClose={all_roles && all_roles.length > 0 ? () => setCurrentStep('role') : undefined}
                />
            )}
        </FixedLayout>
    );
}
