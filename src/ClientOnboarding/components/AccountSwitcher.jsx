import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronDown, FiCheck } from 'react-icons/fi';
import { userAPI, handleAPIError } from '../utils/apiUtils';
import { getStorage, setTokens } from '../utils/userUtils';
import { toast } from 'react-toastify';
import '../styles/AccountSwitcher.css';

const ROLE_DISPLAY_NAMES = {
  team_member: 'Team Member',
  taxpayer: 'Taxpayer',
  firm_admin: 'Firm Admin',
  admin: 'Firm Admin',
  firm: 'Firm Admin',
};

const STATUS_COLORS = {
  active: '#10B981', // Green
  pending: '#F59E0B', // Amber/Orange
  disabled: '#6B7280', // Gray
};

export default function AccountSwitcher() {
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState([]);
  const [currentFirm, setCurrentFirm] = useState(null);
  const [loading, setLoading] = useState(false); // Start as false to not block
  const [switching, setSwitching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasTriedFetch, setHasTriedFetch] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Fetch memberships with timeout and error handling
  const fetchMemberships = useCallback(async () => {
    let timeoutId;
    try {
      setLoading(true);
      
      // Add timeout to prevent hanging - fail fast
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Request timeout')), 3000);
      });
      
      // Make API call and silently handle expected errors
      const apiPromise = userAPI.getMemberships().catch(err => {
        // Check if this is an expected error that should be silent
        const errorMessage = err?.message || '';
        const errorString = String(err);
        const isExpectedError = 
          errorMessage.includes('400') ||
          errorMessage.includes('401') ||
          errorMessage.includes('403') ||
          errorMessage.includes('User identity not found') ||
          errorMessage.includes('Bad Request') ||
          errorString.includes('memberships');
        
        // For expected errors, return empty result silently
        // For unexpected errors, still return empty but could log (currently silent)
        return { success: false, data: [] };
      });
      
      const response = await Promise.race([apiPromise, timeoutPromise]);

      if (response && response.success && response.data) {
        const membershipsList = Array.isArray(response.data) 
          ? response.data 
          : (response.data.memberships || []);

        setMemberships(membershipsList);

        // Find current firm from user data
        const storage = getStorage();
        const userDataStr = storage?.getItem('userData');
        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            const currentFirmId = userData.firm?.id || userData.firm_id;
            const current = membershipsList.find(
              (m) => m.firm?.id === currentFirmId || m.firm_id === currentFirmId
            );
            if (current) {
              setCurrentFirm(current);
            } else if (membershipsList.length > 0) {
              // Fallback to first active membership
              const active = membershipsList.find((m) => m.status === 'active');
              setCurrentFirm(active || membershipsList[0]);
            }
          } catch (e) {
            // Silently handle parsing errors
          }
        }
      } else {
        // No memberships or API not available - set empty state
        setMemberships([]);
        setCurrentFirm(null);
      }
    } catch (error) {
      // Check if this is an expected error
      const errorMessage = error?.message || '';
      const isExpectedError = 
        errorMessage.includes('Request timeout') ||
        errorMessage.includes('400') ||
        errorMessage.includes('401') ||
        errorMessage.includes('403') ||
        errorMessage.includes('User identity not found');
      
      // Only log unexpected errors
      if (!isExpectedError) {
        // Silently handle expected errors
      }
      
      // Set empty state to prevent infinite loading
      setMemberships([]);
      setCurrentFirm(null);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch once, and only if we haven't tried yet
    if (hasTriedFetch) return;
    
    let mounted = true;
    let timeoutId;
    let fetchTimeout;
    
    // Fetch memberships on mount with safety timeout - non-blocking
    const loadMemberships = async () => {
      if (!mounted) return;
      
      try {
        setHasTriedFetch(true);
        setLoading(true);
        await fetchMemberships();
      } catch (error) {
        // Silently fail - component will just not show
        if (mounted) {
          setLoading(false);
          setMemberships([]);
          setCurrentFirm(null);
        }
      }
    };
    
    // Set a maximum timeout to ensure loading state is cleared - CRITICAL
    timeoutId = setTimeout(() => {
      if (mounted) {
        // Silently clear loading state - no console warning needed
        setLoading(false);
        setMemberships([]);
        setCurrentFirm(null);
      }
    }, 3000); // 3 second max timeout - fail fast
    
    // Delay the fetch slightly to not block initial page load
    fetchTimeout = setTimeout(() => {
      if (mounted) {
        loadMemberships();
      }
    }, 1000); // Wait 1 second before fetching to not block page load
    
    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (fetchTimeout) clearTimeout(fetchTimeout);
    };
  }, []); // Empty deps - only run once

  // Handle firm switch
  const handleSwitchFirm = async (membership) => {
    if (switching || membership.firm?.id === currentFirm?.firm?.id) {
      return;
    }

    try {
      setSwitching(true);
      const firmId = membership.firm?.id || membership.firm_id;

      const response = await userAPI.switchFirm(firmId);

      if (response.success && response.data) {
        // Update tokens if provided
        if (response.data.tokens) {
          setTokens(
            response.data.tokens.access,
            response.data.tokens.refresh,
            true
          );
        }

        // Update user data
        if (response.data.user) {
          const storage = getStorage();
          storage.setItem('userData', JSON.stringify(response.data.user));
          storage.setItem('userType', response.data.user.user_type || 'client');
          storage.setItem('isLoggedIn', 'true');
        }

        setCurrentFirm(membership);
        setShowDropdown(false);

        toast.success(`Switched to ${membership.firm?.name || 'firm'}`, {
          position: 'top-right',
          autoClose: 2000,
        });

        // Navigate based on role
        const role = membership.role || membership.user_type;
        let redirectPath = '/dashboard';

        if (role === 'firm_admin' || role === 'admin' || role === 'firm') {
          redirectPath = '/firmadmin';
        } else if (role === 'team_member' || role === 'staff' || role === 'tax_preparer') {
          redirectPath = '/taxdashboard';
        } else if (role === 'taxpayer' || role === 'client') {
          redirectPath = '/dashboard';
        }

        // Reload to update context
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 500);
      } else {
        throw new Error(response.message || 'Failed to switch firm');
      }
    } catch (error) {
      console.error('Error switching firm:', error);
      toast.error(handleAPIError(error) || 'Failed to switch firm', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setSwitching(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Don't show if no memberships or only one membership
  // Always return null immediately if loading or if we don't have multiple memberships
  // This prevents blocking the page
  if (loading) {
    // Still loading, but don't block - return null immediately
    return null;
  }

  if (!memberships || memberships.length <= 1) {
    return null;
  }

  if (!currentFirm) {
    return null;
  }

  const currentFirmName = currentFirm.firm?.name || 'Firm';
  const currentRole = ROLE_DISPLAY_NAMES[currentFirm.role] || currentFirm.role || 'Member';
  const currentStatus = currentFirm.status || 'active';

  return (
    <div className="position-relative account-switcher-container">
      <button
        ref={buttonRef}
        onClick={() => setShowDropdown(!showDropdown)}
        className="account-switcher-button"
        disabled={switching}
      >
        <div className="account-switcher-content">
          <div className="account-switcher-firm-name">{currentFirmName}</div>
          <div className="account-switcher-meta">
            <span className="account-switcher-role">{currentRole}</span>
            <span className="account-switcher-separator">•</span>
            <span
              className="account-switcher-status"
              style={{ color: STATUS_COLORS[currentStatus] || STATUS_COLORS.active }}
            >
              {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
            </span>
          </div>
        </div>
        <FiChevronDown
          className={`account-switcher-arrow ${showDropdown ? 'open' : ''}`}
        />
      </button>

      {showDropdown && (
        <div ref={dropdownRef} className="account-switcher-dropdown">
          <div className="account-switcher-dropdown-header">All Firms</div>
          <div className="account-switcher-dropdown-list">
            {memberships.map((membership) => {
              const isCurrent = membership.firm?.id === currentFirm.firm?.id;
              const firmName = membership.firm?.name || 'Firm';
              const role = ROLE_DISPLAY_NAMES[membership.role] || membership.role || 'Member';
              const status = membership.status || 'active';
              const officeScope = membership.office_scope || membership.offices || [];

              return (
                <div
                  key={membership.id || membership.firm?.id}
                  className={`account-switcher-item ${isCurrent ? 'current' : ''} ${status === 'pending' ? 'pending' : ''}`}
                  onClick={() => !isCurrent && handleSwitchFirm(membership)}
                  style={{ cursor: isCurrent ? 'default' : 'pointer' }}
                >
                  <div className="account-switcher-item-header">
                    {isCurrent && (
                      <FiCheck className="account-switcher-check-icon" />
                    )}
                    <div className="account-switcher-item-content">
                      <div className="account-switcher-item-firm-name">{firmName}</div>
                      <div className="account-switcher-item-meta">
                        <span className="account-switcher-item-role">{role}</span>
                        <span className="account-switcher-separator">•</span>
                        <span
                          className="account-switcher-item-status"
                          style={{ color: STATUS_COLORS[status] || STATUS_COLORS.active }}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </div>
                      {officeScope.length > 0 && (
                        <div className="account-switcher-office-scope">
                          Offices: {officeScope.map(o => o.name || o).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

