import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import RoleSelectionModal from '../components/RoleSelectionModal';
import FirmSelectionModal from '../components/FirmSelectionModal';
import FixedLayout from '../ClientOnboarding/components/FixedLayout';

// Role categories for strict filtering
const FIRM_ROLES = new Set([
    'firm', 'admin', 'FirmAdmin', 'firmadmin',
    'staff', 'tax_preparer', 'TeamMember', 'team_member',
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
    if (['firm', 'admin', 'firmadmin', 'firm_admin', 'staff', 'tax_preparer',
        'team_member', 'teammember', 'accountant', 'bookkeeper', 'assistant',
        'preparer'].includes(lower)) {
        return 'firm';
    }
    // Taxpayer/client roles
    if (['client', 'taxpayer'].includes(lower)) {
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
    // Pressing back here is dangerous — tokens may be partially set.
    // Instead, send the user to /login.
    useEffect(() => {
        // Push a dummy entry so the back button has something to pop
        window.history.pushState(null, '', window.location.href);

        const handlePopState = () => {
            // Every time the user tries to go back, push the state again
            // to keep them on this page, then redirect to login cleanly.
            navigate('/login', { replace: true });
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [navigate]);

    const handleRoleSelected = (selectedUser, loginCategory) => {
        // Track which login category was selected so we can filter firms
        const category = loginCategory || getRoleCategory(
            selectedUser?.active_role || selectedUser?.user_type
        );
        setSelectedLoginCategory(category);

        // If firm selection is also needed, show firm modal (with filtered firms)
        if (needs_firm_selection) {
            setCurrentStep('firm');
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
