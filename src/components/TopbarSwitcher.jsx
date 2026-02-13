import { useState, useEffect, useRef } from 'react';
import './TopbarSwitcher.css';
import { userAPI } from '../ClientOnboarding/utils/apiUtils';
import { setTokens } from '../ClientOnboarding/utils/userUtils';

export default function TopbarSwitcher() {
    const [contexts, setContexts] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        loadContexts();

        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadContexts = async () => {
        try {
            const data = await userAPI.getAvailableContexts();
            if (data.success) {
                setContexts(data.data);
            }
        } catch (error) {
            console.error('Error loading contexts:', error);
        }
    };

    const switchContext = async (role = null, membershipId = null) => {
        setLoading(true);

        try {
            const data = await userAPI.switchContext(role, membershipId);

            if (data.success) {
                // Update tokens
                const rememberMe = localStorage.getItem('rememberMe') === 'true' || sessionStorage.getItem('rememberMe') === 'true';
                setTokens(data.access_token, data.refresh_token, rememberMe);

                // Update storage
                const storage = rememberMe ? localStorage : sessionStorage;
                storage.setItem('userData', JSON.stringify(data.user));
                storage.setItem('userType', data.user.active_role || data.user.user_type);

                // Reload page to apply new context
                window.location.reload();
            }
        } catch (error) {
            console.error('Error switching context:', error);
        } finally {
            setLoading(false);
            setShowDropdown(false);
        }
    };

    if (!contexts) return null;

    // Only show if user has multiple roles OR multiple firms
    const shouldShow = contexts.needs_role_selection || contexts.needs_firm_selection;
    if (!shouldShow) return null;

    return (
        <div className="topbar-switcher" ref={dropdownRef}>
            <button
                className="switcher-button"
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={loading}
            >
                <div className="current-context">
                    <span className="context-firm">
                        {contexts.current_context.firm?.name || 'No Firm'}
                    </span>
                    <span className="context-divider">•</span>
                    <span className="context-role">
                        {contexts.current_context.role_display}
                    </span>
                </div>
                <svg
                    className={`dropdown-icon ${showDropdown ? 'open' : ''}`}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                >
                    <path
                        d="M4 6L8 10L12 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {showDropdown && (
                <div className="switcher-dropdown">
                    {/* Role Switcher */}
                    {contexts.needs_role_selection && (
                        <div className="switcher-section">
                            <h4 className="section-title">Switch Role</h4>
                            <div className="section-items">
                                {contexts.all_roles.map((role) => (
                                    <button
                                        key={role.role}
                                        className={`dropdown-item ${role.is_active ? 'active' : ''}`}
                                        onClick={() => switchContext(role.role, null)}
                                        disabled={loading || role.is_active}
                                    >
                                        <span className="item-text">{role.display_name}</span>
                                        {role.is_active && <span className="item-badge">Active</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Firm Switcher */}
                    {contexts.needs_firm_selection && (
                        <div className="switcher-section">
                            <h4 className="section-title">Switch Firm</h4>
                            <div className="section-items">
                                {contexts.all_firms.map((firmData) => (
                                    <button
                                        key={firmData.membership_id}
                                        className={`dropdown-item ${firmData.is_current ? 'active' : ''}`}
                                        onClick={() => switchContext(null, firmData.membership_id)}
                                        disabled={loading || firmData.is_current}
                                    >
                                        <div className="firm-info">
                                            <strong className="firm-name">{firmData.firm.name}</strong>
                                            <small className="firm-role">{firmData.role_display}</small>
                                        </div>
                                        {firmData.is_current && <span className="item-badge">Current</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
