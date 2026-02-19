import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import RoleSelectionModal from '../components/RoleSelectionModal';
import FirmSelectionModal from '../components/FirmSelectionModal';
import FixedLayout from '../ClientOnboarding/components/FixedLayout';

export default function SelectContext() {
    const location = useLocation();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState('role'); // 'role' or 'firm'

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

    const handleRoleSelected = (selectedUser) => {
        // If client role is selected, redirect to client dashboard immediately
        // bypassing firm selection even if it was initially required
        const userRole = selectedUser.active_role || selectedUser.user_type;
        if (userRole === 'client') {
            redirectToDashboard(selectedUser);
            return;
        }

        // If firm selection is also needed, show firm modal
        if (needs_firm_selection) {
            setCurrentStep('firm');
        } else {
            // Otherwise, redirect to dashboard
            redirectToDashboard(selectedUser);
        }
    };

    const handleFirmSelected = (selectedUser) => {
        // Redirect to dashboard after firm selection
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
        } else if (userType === 'client') {
            navigate('/dashboard', { replace: true });
        } else {
            navigate('/dashboard', { replace: true });
        }
    };

    return (
        <FixedLayout>
            {currentStep === 'role' && all_roles && all_roles.length > 0 && (
                <RoleSelectionModal
                    roles={all_roles}
                    onSelect={handleRoleSelected}
                />
            )}

            {currentStep === 'firm' && needs_firm_selection && (
                <FirmSelectionModal
                    firms={all_firms}
                    onSelect={handleFirmSelected}
                    onClose={all_roles && all_roles.length > 0 ? () => setCurrentStep('role') : undefined}
                />
            )}
        </FixedLayout>
    );
}
