import { useState } from 'react';
import PropTypes from 'prop-types';
import './FirmSelectionModal.css';
import { userAPI } from '../ClientOnboarding/utils/apiUtils';
import { setTokens } from '../ClientOnboarding/utils/userUtils';

export default function FirmSelectionModal({ firms, onSelect, onClose }) {
    const [selectedMembership, setSelectedMembership] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        if (!selectedMembership) {
            setError('Please select a firm to continue');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await userAPI.selectFirm(selectedMembership);

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
                setError(data.message || 'Failed to select firm');
            }
        } catch (err) {
            console.error('Error selecting firm:', err);
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="firm-selection-modal-overlay">
            <div className="firm-selection-modal">
                <div className="firm-selection-header">
                    <h2>Select Your Firm</h2>
                    <p>You are a member of multiple firms. Please select one to continue.</p>
                </div>

                {error && (
                    <div className="firm-selection-error">
                        {error}
                    </div>
                )}

                <div className="firm-list">
                    {firms.map((firmData) => (
                        <div
                            key={firmData.membership_id}
                            className={`firm-card ${selectedMembership === firmData.membership_id ? 'selected' : ''}`}
                            onClick={() => setSelectedMembership(firmData.membership_id)}
                        >
                            <div className="firm-card-header">
                                <h3>{firmData.firm.name}</h3>
                                {firmData.is_current && <span className="badge current-badge">Current</span>}
                            </div>

                            <div className="firm-card-body">
                                <div className="firm-info-row">
                                    <span className="firm-label">Role:</span>
                                    <span className="firm-value">{firmData.role_display}</span>
                                </div>

                                <div className="firm-info-row">
                                    <span className="firm-label">Status:</span>
                                    <span className={`firm-status ${firmData.status.toLowerCase()}`}>
                                        {firmData.status}
                                    </span>
                                </div>

                                {firmData.last_active_at && (
                                    <div className="firm-info-row">
                                        <span className="firm-label">Last Active:</span>
                                        <span className="firm-value">{formatDate(firmData.last_active_at)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="firm-selection-actions">
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedMembership || loading}
                        className="btn-continue"
                    >
                        {loading ? 'Loading...' : 'Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
}

FirmSelectionModal.propTypes = {
    firms: PropTypes.arrayOf(
        PropTypes.shape({
            membership_id: PropTypes.number.isRequired,
            firm: PropTypes.shape({
                id: PropTypes.number.isRequired,
                name: PropTypes.string.isRequired,
                subdomain: PropTypes.string,
                status: PropTypes.string,
            }).isRequired,
            role: PropTypes.string.isRequired,
            role_display: PropTypes.string.isRequired,
            status: PropTypes.string.isRequired,
            is_current: PropTypes.bool,
            last_active_at: PropTypes.string,
        })
    ).isRequired,
    onSelect: PropTypes.func.isRequired,
    onClose: PropTypes.func,
};
