import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronDown, FiCheck } from 'react-icons/fi';
import { userAPI, handleAPIError } from '../utils/apiUtils';
import { getStorage, setTokens, getAccessToken } from '../utils/userUtils';
import { getPathWithPrefix } from '../utils/urlUtils';
import { getApiBaseUrl } from '../utils/corsConfig';
import { toast } from 'react-toastify';
import '../styles/AccountSwitcher.css';

const ROLE_DISPLAY_NAMES = {
  team_member: 'Tax Preparer',
  teammember: 'Tax Preparer',
  tax_preparer: 'Tax Preparer',
  taxpreparer: 'Tax Preparer',
  staff: 'Tax Preparer',
  taxpayer: 'Client',
  client: 'Client',
  firm_admin: 'Firm Admin',
  firmadmin: 'Firm Admin',
  admin: 'Firm Admin',
  firm: 'Firm Admin',
  super_admin: 'Super Admin',
  billing_admin: 'Billing Admin',
  support_admin: 'Support Admin'
};

const STATUS_COLORS = {
  active: '#10B981', // Green
  pending: '#F59E0B', // Amber/Orange
  disabled: '#6B7280', // Gray
};

export default function AccountSwitcher() {
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState([]);
  const [currentMembership, setCurrentMembership] = useState(null);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Normalize role string (snake_case)
  const normalizeRole = (role) => {
    if (!role) return '';
    if (typeof role !== 'string') return String(role);
    // Convert camelCase to snake_case
    return role.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  };

  // Normalize status string
  const normalizeStatus = (status) => {
    if (!status) return 'active';
    return String(status).toLowerCase();
  };

  // Process raw memberships data
  const processMemberships = useCallback((rawFirms, currentFirmId = null, currentRole = null, activeUserType = null) => {
    if (!Array.isArray(rawFirms)) return [];

    let hasFoundCurrent = false;

    return rawFirms.map(firm => {
      // Handle various data structures from different API endpoints
      const rawRole = firm.membership?.role || firm.role || 'team_member';
      const role = normalizeRole(rawRole);
      const status = normalizeStatus(firm.membership?.status || firm.status);
      const firmId = parseInt(firm.membership?.firm_id || firm.firm_id || firm.firm?.id || firm.id);
      const firmName = firm.firm?.name || firm.name || 'Firm';

      // Determine if this is the current membership
      let isCurrent = false;

      // 1. API authoritative flag (Backend directly handles this logic accurately)
      if (firm.is_current === true) {
        isCurrent = true;
      }
      // 2. Fallback strict validation: Matches Firm ID AND Active Role Type
      else if (currentFirmId && activeUserType) {
        const isSameFirm = firmId === parseInt(currentFirmId);
        let isRoleMatch = false;

        // Map role to userType for comparison
        if (activeUserType === 'client') {
          isRoleMatch = ['client', 'taxpayer'].includes(role);
        } else if (activeUserType === 'tax_preparer') {
          isRoleMatch = ['team_member', 'teammember', 'tax_preparer', 'taxpreparer', 'staff'].includes(role);
        } else if (activeUserType === 'admin') {
          isRoleMatch = ['firm_admin', 'admin', 'firm', 'firmadmin'].includes(role);
        } else if (activeUserType === 'super_admin') {
          isRoleMatch = ['super_admin'].includes(role);
        }

        // Only fallback to currentRole string check if it doesn't conflict with userType awareness
        if (!isRoleMatch && currentRole) {
          // Extra safety: only allow if userType wasn't decisive
          isRoleMatch = role === normalizeRole(currentRole);
        }

        isCurrent = isSameFirm && isRoleMatch;
      }

      // 3. Last resort fallback
      else if (currentFirmId) {
        isCurrent = firmId === parseInt(currentFirmId) && (!currentRole || role === normalizeRole(currentRole));
      }

      if (isCurrent) {
        if (hasFoundCurrent) {
          isCurrent = false;
        } else {
          hasFoundCurrent = true;
        }
      }

      return {
        id: firm.membership?.id || firm.id, // Membership ID or Firm ID
        firm: {
          id: firmId,
          name: firmName
        },
        firm_id: firmId,
        role: role,
        user_type: firm.user_type,
        status: status,
        office_scope: firm.membership?.office_location_scope?.offices || [],
        offices: firm.membership?.office_location_scope?.offices || [],
        is_current: isCurrent,
        raw_data: firm
      };
    });
  }, []);

  // Fetch memberships from API and Storage
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const storage = getStorage();
        const userDataStr = storage?.getItem('userData');
        const userType = storage?.getItem('userType'); // Get active user type

        let userData = null;
        let currentFirmId = null;
        let currentRole = null;

        if (userDataStr) {
          try {
            userData = JSON.parse(userDataStr);
            currentFirmId = userData.firm?.id || userData.firm_id;
            currentRole = userData.role;
          } catch (e) {
            console.error("Error parsing userData", e);
          }
        }

        const getRoleCategory = (roleCode) => {
          const r = normalizeRole(roleCode);
          if (['client', 'taxpayer'].includes(r)) return 'taxpayer';
          return 'firm';
        };

        const activeCategory = (userType === 'client' || currentRole === 'client' || currentRole === 'taxpayer')
          ? 'taxpayer'
          : 'firm';

        // 1. Try to load from "firmsData" storage (fastest)
        const firmsDataStr = storage?.getItem('firmsData');
        let initialMemberships = [];
        if (firmsDataStr) {
          try {
            const storedFirms = JSON.parse(firmsDataStr);
            const processed = processMemberships(storedFirms, currentFirmId, currentRole, userType);
            initialMemberships = processed.filter(m => getRoleCategory(m.role) === activeCategory);
          } catch (e) { }
        }

        // 2. Also check userData.firms (fallback)
        if (initialMemberships.length === 0 && userData?.firms) {
          const processed = processMemberships(userData.firms, currentFirmId, currentRole, userType);
          initialMemberships = processed.filter(m => getRoleCategory(m.role) === activeCategory);
        }

        if (mounted && initialMemberships.length > 0) {
          setMemberships(initialMemberships);
          const current = initialMemberships.find(m => m.is_current) || initialMemberships[0];
          setCurrentMembership(current);
        }

        // 3. Fetch fresh from API (background update)
        try {
          const response = await userAPI.getMemberships();
          if (mounted && response.success && Array.isArray(response.data)) {
            const processedFresh = processMemberships(response.data, currentFirmId, currentRole, userType);
            let freshMemberships = processedFresh.filter(m => getRoleCategory(m.role) === activeCategory);

            // Sort: Active first, then by name
            freshMemberships.sort((a, b) => {
              if (a.is_current) return -1;
              if (b.is_current) return 1;
              return a.firm.name.localeCompare(b.firm.name);
            });

            setMemberships(freshMemberships);

            // Update current
            const current = freshMemberships.find(m => m.is_current);
            if (current) {
              setCurrentMembership(current);
              // Update storage with fresh data just in case
              if (storage) {
                storage.setItem('firmsData', JSON.stringify(response.data));
              }
            } else if (initialMemberships.length === 0 && freshMemberships.length > 0) {
              setCurrentMembership(freshMemberships[0]);
            }
          }
        } catch (apiError) {
          // Ignore API errors in background fetch
        }

      } catch (error) {
        console.error("AccountSwitcher initialization error", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => { mounted = false; };
  }, [processMemberships]);


  const handleSwitch = async (targetMembership) => {
    if (switching) return;

    // Don't switch if already current
    if (targetMembership.is_current) {
      setShowDropdown(false);
      return;
    }

    try {
      setSwitching(true);
      const apiBaseUrl = getApiBaseUrl(); // Ensure we have base URL
      const token = getAccessToken();

      let responseData = null;

      // Check if we are switching role within SAME firm
      if (currentMembership && targetMembership.firm.id === currentMembership.firm.id && targetMembership.role !== currentMembership.role) {
        // Same firm, different role -> Use Switch Role API
        console.log('AccountSwitcher: Switching Role within same firm', targetMembership.role);

        const roleMapping = {
          'team_member': 'tax_preparer',
          'teammember': 'tax_preparer',
          'staff': 'tax_preparer',
          'taxpayer': 'client',
          'firm_admin': 'firm',
          'firmadmin': 'firm',
          'admin': 'firm',
          'client': 'client'
        };

        const apiRole = roleMapping[targetMembership.role] || targetMembership.role;

        const res = await fetch(`${apiBaseUrl}/user/switch-role/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ role: apiRole })
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Role switch failed');
        }

        // Standardize response to look like switchFirm response
        responseData = {
          user: json.user,
          tokens: { access: json.access_token, refresh: json.refresh_token },
          firms: json.firms
        };

      } else {
        // Different firm (or fallback) -> Use Switch Firm API
        console.log('AccountSwitcher: Switching Firm', targetMembership.firm.id, targetMembership.role);
        const res = await userAPI.switchFirm(targetMembership.firm.id, targetMembership.role);
        if (!res.success) {
          throw new Error(res.message || 'Firm switch failed');
        }
        responseData = res.data || (res.user ? res : null);
      }

      // Handle Successful Switch
      if (responseData) {
        // 1. Update Tokens - handle both wrapped and flat formats
        if (responseData.tokens) {
          setTokens(responseData.tokens.access, responseData.tokens.refresh, true);
        } else if (responseData.access_token && responseData.refresh_token) {
          setTokens(responseData.access_token, responseData.refresh_token, true);
        } else if (responseData.access && responseData.refresh) {
          setTokens(responseData.access, responseData.refresh, true);
        }

        // 2. Get Fresh Storage Reference (Critical step!)
        const storage = getStorage();

        // 3. Update User Data
        if (responseData.user && storage) {
          storage.setItem('userData', JSON.stringify(responseData.user));
          storage.setItem('isLoggedIn', 'true');
        }

        // 4. Update Firms Data
        if (responseData.firms && Array.isArray(responseData.firms) && storage) {
          // We store the raw response. is_current will be recalculated on next load.
          // But we can help it by mapping active flag if needed.
          // Actually, let's just store raw data. processMemberships handles the rest.
          storage.setItem('firmsData', JSON.stringify(responseData.firms));
        }

        // 5. Determine Redirect Path & User Type
        const role = normalizeRole(targetMembership.role);
        let redirectPath = '/dashboard';
        let userType = 'client';

        if (['firm_admin', 'admin', 'firm', 'firmadmin'].includes(role)) {
          redirectPath = '/firmadmin';
          userType = 'admin';
        } else if (['team_member', 'teammember', 'tax_preparer', 'taxpreparer', 'staff'].includes(role)) {
          redirectPath = '/taxdashboard';
          userType = 'tax_preparer';
        } else if (['client', 'taxpayer'].includes(role)) {
          redirectPath = '/dashboard';
          userType = 'client';
        } else if (['super_admin'].includes(role)) {
          redirectPath = '/superadmin';
          userType = 'super_admin';
        }

        // 6. Set User Type (CRITICAL for Route Protection)
        if (storage) {
          storage.setItem('userType', userType);
        }

        // 7. Feedback & Redirect
        const displayRole = ROLE_DISPLAY_NAMES[role] || role;
        toast.success(`Switched to ${targetMembership.firm.name} (${displayRole})`);
        setShowDropdown(false);

        // Force Reload to clear state/cache and ensure context update
        setTimeout(() => {
          window.location.href = getPathWithPrefix(redirectPath);
        }, 500);
      }

    } catch (error) {
      console.error("Switch failed", error);
      toast.error(handleAPIError(error) || 'Failed to switch account');
    } finally {
      setSwitching(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);


  if (!currentMembership) return null;
  if (!memberships || memberships.length <= 1) return null;

  // Use display names
  // Use explicit mapping to ensure "Team Member" -> "Tax Preparer" visually
  const normalizedCurrentRole = normalizeRole(currentMembership.role);
  const currentRoleName = ROLE_DISPLAY_NAMES[normalizedCurrentRole] || 'Member';

  return (
    <div className="position-relative account-switcher-container">
      <button
        ref={buttonRef}
        onClick={() => !switching && setShowDropdown(!showDropdown)}
        className="account-switcher-button"
        disabled={switching}
      >
        <div className="account-switcher-content">
          <div className="account-switcher-firm-name">{currentMembership.firm.name}</div>
          <div className="account-switcher-meta">
            <span className="account-switcher-role">{currentRoleName}</span>
            <span className="account-switcher-separator">•</span>
            <span
              className="account-switcher-status"
              style={{ color: STATUS_COLORS[currentMembership.status] || STATUS_COLORS.active }}
            >
              {currentMembership.status.charAt(0).toUpperCase() + currentMembership.status.slice(1)}
            </span>
          </div>
        </div>
        <FiChevronDown className={`account-switcher-arrow ${showDropdown ? 'open' : ''}`} />
      </button>

      {showDropdown && (
        <div ref={dropdownRef} className="account-switcher-dropdown">
          <div className="account-switcher-dropdown-header">Select Account</div>
          <div className="account-switcher-dropdown-list">
            {memberships.map((membership) => {
              const isCurrent = membership.is_current;
              const roleCode = normalizeRole(membership.role);
              const roleName = ROLE_DISPLAY_NAMES[roleCode] || membership.role;
              const key = `${membership.firm.id}-${membership.role}`;

              return (
                <div
                  key={key}
                  className={`account-switcher-item ${isCurrent ? 'current' : ''}`}
                  onClick={() => !isCurrent && handleSwitch(membership)}
                >
                  <div className="account-switcher-item-header">
                    {isCurrent && <FiCheck className="account-switcher-check-icon" />}
                    <div className="account-switcher-item-content">
                      <div className="account-switcher-item-firm-name">{membership.firm.name}</div>
                      <div className="account-switcher-item-meta">
                        <span className="account-switcher-item-role">{roleName}</span>
                        <span className="account-switcher-separator">•</span>
                        <span
                          className="account-switcher-item-status"
                          style={{ color: STATUS_COLORS[membership.status] || STATUS_COLORS.active }}
                        >
                          {membership.status.charAt(0).toUpperCase() + membership.status.slice(1)}
                        </span>
                      </div>
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
