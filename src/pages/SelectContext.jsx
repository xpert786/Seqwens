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
    // Firm-level roles
    if (FIRM_ROLES.has(lower) ||
        ['firm', 'admin', 'firmadmin', 'firm_admin', 'staff', 'tax_preparer',
            'team_member', 'teammember', 'accountant', 'bookkeeper', 'assistant', 'preparer'].includes(lower)) {
        return 'firm';
    }
    // Taxpayer/client roles
    if (TAXPAYER_ROLES.has(lower) || ['client', 'taxpayer'].includes(lower)) {
        return 'taxpayer';
    }
    return 'other';
}

/**
 * Filter firm memberships strictly based on login category.
 * - 'firm' category  → only show memberships where role is a firm-level role
 * - 'taxpayer' category → only show memberships where role is a taxpayer role
 * - 'other' → show all
 */
function filterFirmsForCategory(allFirms, loginCategory) {
    if (!allFirms || allFirms.length === 0) return [];
    if (loginCategory === 'firm') {
        // Strictly only firm-level memberships — never mix in taxpayer accounts
        return allFirms.filter(f => getRoleCategory(f.role) === 'firm');
    }
    if (loginCategory === 'taxpayer') {
        // Strictly only taxpayer/client memberships — never mix in firm accounts
        return allFirms.filter(f => getRoleCategory(f.role) === 'taxpayer');
    }
    return allFirms;
}

export default function SelectContext() {
    const location = useLocation();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState('role'); // 'role' or 'firm'
    const [selectedLoginCategory, setSelectedLoginCategory] = useState(null); // 'firm' or 'taxpayer'

    const {
        needs_role_selection,
        needs_firm_selection,
        all_roles,
        all_firms,
        user
    } = location.state || {};

    useEffect(() => {
        // If no state data, redirect to login
        if (!location.state) {
            navigate('/login', { replace: true });
            return;
        }

        // Determine initial login category if role selection is skipped
        if (!needs_role_selection && needs_firm_selection) {
            const initialCategory = getRoleCategory(user?.active_role || user?.user_type || user?.role?.[0] || user?.role);
            setSelectedLoginCategory(initialCategory);

            // Auto-select if there's only one firm in this category
            const firmsForCat = filterFirmsForCategory(all_firms, initialCategory);
            if (firmsForCat.length === 1) {
                console.log('Skipping firm selection: only one membership available');
                autoSelectFirm(firmsForCat[0]);
                return;
            }
        }

        // Determine which step to show first
        if (needs_role_selection) {
            setCurrentStep('role');
        } else if (needs_firm_selection) {
            setCurrentStep('firm');
        } else {
            // No selection needed, redirect to dashboard
            redirectToDashboard(user);
        }
    }, [location.state, navigate, needs_role_selection, needs_firm_selection, user]);

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
                const rememberMe = localStorage.getItem('rememberMe') === 'true' || sessionStorage.getItem('rememberMe') === 'true';
                setTokens(data.access_token, data.refresh_token, rememberMe);
                const storage = rememberMe ? localStorage : sessionStorage;
                storage.setItem('userData', JSON.stringify(data.user));
                storage.setItem('userType', data.user.active_role || data.user.user_type);
                redirectToDashboard(data.user);
            }
        } catch (err) {
            console.error('Auto-select firm error:', err);
            setCurrentStep('firm'); // Show manual selection as fallback
        }
    };

    const handleRoleSelected = (selectedUser, loginCategory) => {
        // Track which login category was selected so we can filter firms
        const category = loginCategory || getRoleCategory(
            selectedUser?.active_role || selectedUser?.user_type || selectedUser?.role?.[0] || selectedUser?.role
        );
        setSelectedLoginCategory(category);

        // If firm selection is also needed, check if we can auto-select or skip
        if (needs_firm_selection) {
            const applicableFirms = filterFirmsForCategory(all_firms, category);

            if (applicableFirms.length === 0) {
                // No membership-based firms for this role category.
                // This happens when the firm role comes from a linked User record (not a Membership).
                // select-role/ has already resolved the context — just go to dashboard.
                console.log('No firm memberships for selected category, proceeding to dashboard directly.');
                redirectToDashboard(selectedUser);
            } else if (applicableFirms.length === 1) {
                // Only one firm — auto-select without prompting
                autoSelectFirm(applicableFirms[0]);
            } else {
                // Multiple firms — show the selection screen
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

    // Filter firms based on selected login category
    const filteredFirms = filterFirmsForCategory(all_firms, selectedLoginCategory);

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
