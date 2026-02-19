import { useState } from 'react';
import PropTypes from 'prop-types';
import './RoleSelectionModal.css';
import { userAPI } from '../ClientOnboarding/utils/apiUtils';
import { setTokens } from '../ClientOnboarding/utils/userUtils';

export default function RoleSelectionModal({ roles, onSelect, onClose }) {
    const [selectedRole, setSelectedRole] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        if (!selectedRole) {
            setError('Please select a role to continue');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await userAPI.selectRole(selectedRole);

            if (data.success) {
                // Update tokens
                const rememberMe = localStorage.getItem('rememberMe') === 'true' || sessionStorage.getItem('rememberMe') === 'true';
                setTokens(data.access_token, data.refresh_token, rememberMe);

                // Update storage
                const storage = rememberMe ? localStorage : sessionStorage;
                storage.setItem('userData', JSON.stringify(data.user));
                storage.setItem('userType', data.user.active_role || data.user.user_type);

                // Call onSelect callback
                onSelect(data.user);
            } else {
                setError(data.message || 'Failed to select role');
            }
        } catch (err) {
            console.error('Error selecting role:', err);
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="role-selection-modal-overlay">
            <div className="role-selection-modal">
                <div className="role-selection-header">
                    <h4>Select Your Role</h4>
                    <p>You have multiple roles. Please select one to continue.</p>
                </div>

                {error && (
                    <div className="role-selection-error">
                        {error}
                    </div>
                )}

                <div className="role-list">
                    {roles.map((role) => (
                        <div
                            key={role.role}
                            className={`role-card ${selectedRole === role.role ? 'selected' : ''}`}
                            onClick={() => setSelectedRole(role.role)}
                        >
                            <div className="role-card-content">
                                <h3>{role.display_name}</h3>
                                {role.is_primary && <span className="badge primary-badge">Primary</span>}
                                {role.is_active && <span className="badge active-badge">Current</span>}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="role-selection-actions">
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedRole || loading}
                        className="btn-continue"
                    >
                        {loading ? 'Loading...' : 'Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
}

RoleSelectionModal.propTypes = {
    roles: PropTypes.arrayOf(
        PropTypes.shape({
            role: PropTypes.string.isRequired,
            display_name: PropTypes.string.isRequired,
            is_primary: PropTypes.bool,
            is_active: PropTypes.bool,
        })
    ).isRequired,
    onSelect: PropTypes.func.isRequired,
    onClose: PropTypes.func,
};
