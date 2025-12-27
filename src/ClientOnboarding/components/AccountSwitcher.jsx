import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronDown, FiCheck } from 'react-icons/fi';
import { userAPI, handleAPIError } from '../utils/apiUtils';
import { getStorage, setTokens } from '../utils/userUtils';
import { getPathWithPrefix } from '../utils/urlUtils';
import { toast } from 'react-toastify';
import '../styles/AccountSwitcher.css';

const ROLE_DISPLAY_NAMES = {
  team_member: 'Team Member',
  teammember: 'Team Member', // Handle camelCase from API
  tax_preparer: 'Tax Preparer',
  taxpreparer: 'Tax Preparer', // Handle camelCase from API
  taxpayer: 'Taxpayer',
  firm_admin: 'Firm Admin',
  firmadmin: 'Firm Admin', // Handle camelCase from API
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

  // Load memberships from login response (firms array) stored in localStorage
  const loadMembershipsFromStorage = useCallback(() => {
    try {
      setLoading(true);
      
      const storage = getStorage();
      const firmsDataStr = storage?.getItem('firmsData');
      const userDataStr = storage?.getItem('userData');
      
      // Try to get firms from stored login response
      let firms = [];
      if (firmsDataStr) {
        try {
          firms = JSON.parse(firmsDataStr);
        } catch (e) {
          // Silently handle parsing errors
        }
      }
      
      // If no firms data stored, try to get from userData (fallback)
      if (firms.length === 0 && userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          // Check if firms are stored in userData
          if (userData.firms && Array.isArray(userData.firms)) {
            firms = userData.firms;
          }
        } catch (e) {
          // Silently handle parsing errors
        }
      }
      
      // Map firms array to memberships format
      const membershipsList = firms.map(firm => {
        // Normalize role: "TeamMember" -> "team_member", "TaxPreparer" -> "tax_preparer", etc.
        let role = firm.membership?.role || 'team_member';
        if (typeof role === 'string') {
          // Convert camelCase/PascalCase to snake_case
          role = role.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
        }
        
        // Normalize status: "Active" -> "active", etc.
        let status = firm.membership?.status || firm.status || 'active';
        if (typeof status === 'string') {
          status = status.toLowerCase();
        }
        
        return {
          id: firm.membership?.id || firm.id,
          firm: {
            id: firm.id,
            name: firm.name
          },
          firm_id: firm.id,
          role: role,
          status: status,
          office_scope: firm.membership?.office_location_scope?.offices || [],
          offices: firm.membership?.office_location_scope?.offices || [],
          is_current: firm.is_current || false
        };
      });
      
      if (membershipsList.length > 0) {
        setMemberships(membershipsList);
        
        // Find current firm - prioritize is_current flag, then check userData.firm.id
        let current = membershipsList.find(m => m.is_current);
        
        // If no is_current flag, check userData for current firm
        if (!current) {
          const storage = getStorage();
          const userDataStr = storage?.getItem('userData');
          if (userDataStr) {
            try {
              const userData = JSON.parse(userDataStr);
              const currentFirmId = userData.firm?.id || userData.firm_id;
              if (currentFirmId) {
                current = membershipsList.find(
                  (m) => m.firm?.id === currentFirmId || m.firm_id === currentFirmId
                );
              }
            } catch (e) {
              // Silently handle parsing errors
            }
          }
        }
        
        // Fallback to first active membership
        if (!current) {
          current = membershipsList.find(m => m.status === 'active') || membershipsList[0];
        }
        
        if (current) {
          setCurrentFirm(current);
        }
      } else {
        setMemberships([]);
        setCurrentFirm(null);
      }
    } catch (error) {
      // Silently handle errors
      setMemberships([]);
      setCurrentFirm(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only load once, and only if we haven't tried yet
    if (hasTriedFetch) return;
    
    let mounted = true;
    
    // Load memberships from storage (from login response)
    const loadMemberships = () => {
      if (!mounted) return;
      
      try {
        setHasTriedFetch(true);
        loadMembershipsFromStorage();
      } catch (error) {
        // Silently fail - component will just not show
        if (mounted) {
          setLoading(false);
          setMemberships([]);
          setCurrentFirm(null);
        }
      }
    };
    
    // Load immediately (no delay needed since it's from storage)
    loadMemberships();
    
    return () => {
      mounted = false;
    };
  }, [loadMembershipsFromStorage]); // Include dependency

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
        const storage = getStorage();
        if (response.data.user) {
          storage.setItem('userData', JSON.stringify(response.data.user));
          storage.setItem('isLoggedIn', 'true');
        }
        
        // Determine userType from membership role (not from user.user_type which might be wrong)
        // This ensures tax preparers stay as tax_preparer even if user_type says something else
        let determinedUserType = 'client'; // default
        const membershipRole = membership.role || membership.user_type;
        const membershipRoleLower = membershipRole ? String(membershipRole).toLowerCase() : '';
        
        // Map role to userType
        if (membershipRoleLower === 'firm_admin' || membershipRoleLower === 'admin' || membershipRoleLower === 'firm' || membershipRoleLower === 'firmadmin') {
          determinedUserType = 'admin';
        } else if (membershipRoleLower === 'team_member' || membershipRoleLower === 'teammember' || membershipRoleLower === 'tax_preparer' || membershipRoleLower === 'taxpreparer' || membershipRoleLower === 'staff') {
          determinedUserType = 'tax_preparer';
        } else if (membershipRoleLower === 'taxpayer' || membershipRoleLower === 'client') {
          determinedUserType = 'client';
        } else if (response.data.user?.user_type) {
          // Fallback to user_type from response if role mapping fails
          determinedUserType = response.data.user.user_type;
        }
        
        // Set userType based on membership role, not user.user_type
        storage.setItem('userType', determinedUserType);
        
        // Update firms data if provided in response
        // Also update the is_current flag for all firms based on the switched firm
        const switchedFirmId = membership.firm?.id || membership.firm_id;
        
        if (response.data.firms && Array.isArray(response.data.firms)) {
          // Mark the switched firm as current in the firms array
          const updatedFirms = response.data.firms.map(firm => ({
            ...firm,
            is_current: firm.id === switchedFirmId
          }));
          storage.setItem('firmsData', JSON.stringify(updatedFirms));
        } else {
          // If no firms in response, update the existing firmsData in storage
          const firmsDataStr = storage?.getItem('firmsData');
          if (firmsDataStr) {
            try {
              const firms = JSON.parse(firmsDataStr);
              const updatedFirms = firms.map(firm => ({
                ...firm,
                is_current: firm.id === switchedFirmId
              }));
              storage.setItem('firmsData', JSON.stringify(updatedFirms));
            } catch (e) {
              // Silently handle parsing errors
            }
          }
        }
        
        // Also update the local memberships state to reflect the current firm
        const updatedMemberships = memberships.map(m => ({
          ...m,
          is_current: (m.firm?.id === switchedFirmId) || (m.firm_id === switchedFirmId)
        }));
        setMemberships(updatedMemberships);

        // Update current firm in state - mark the switched membership as current
        const updatedMembership = {
          ...membership,
          is_current: true
        };
        setCurrentFirm(updatedMembership);
        setShowDropdown(false);

        toast.success(`Switched to ${membership.firm?.name || 'firm'}`, {
          position: 'top-right',
          autoClose: 2000,
        });

        // Navigate based on determinedUserType (from membership role) - this is the most reliable
        // The determinedUserType was set based on the membership role, which is what we want
        const determinedUserTypeLower = determinedUserType ? String(determinedUserType).toLowerCase() : '';
        
        let redirectPath = '/dashboard'; // default fallback

        console.log('AccountSwitcher - Redirect logic:', {
          determinedUserType,
          determinedUserTypeLower,
          membershipRole: membership.role,
          membershipUserType: membership.user_type
        });

        // Use determinedUserType as primary source (from membership role)
        if (determinedUserTypeLower === 'admin' || determinedUserTypeLower === 'firm') {
          redirectPath = '/firmadmin';
        } else if (determinedUserTypeLower === 'tax_preparer') {
          redirectPath = '/taxdashboard';
        } else if (determinedUserTypeLower === 'client' || determinedUserTypeLower === 'taxpayer') {
          redirectPath = '/dashboard';
        } else {
          // Fallback: check membership role directly if determinedUserType didn't match
          const membershipRole = membership.role || membership.user_type;
          const membershipRoleLower = membershipRole ? String(membershipRole).toLowerCase() : '';
          
          console.log('AccountSwitcher - Fallback to membership role:', membershipRoleLower);
          
          if (membershipRoleLower === 'firm_admin' || membershipRoleLower === 'admin' || membershipRoleLower === 'firm' || membershipRoleLower === 'firmadmin') {
            redirectPath = '/firmadmin';
          } else if (membershipRoleLower === 'team_member' || membershipRoleLower === 'teammember' || membershipRoleLower === 'staff' || 
                     membershipRoleLower === 'tax_preparer' || membershipRoleLower === 'taxpreparer') {
            redirectPath = '/taxdashboard';
          } else if (membershipRoleLower === 'taxpayer' || membershipRoleLower === 'client') {
            redirectPath = '/dashboard';
          }
        }
        
        console.log('AccountSwitcher - Final redirect path:', redirectPath);

        // Reload to update context
        setTimeout(() => {
          window.location.href = getPathWithPrefix(redirectPath);
        }, 500);
      } else {
        throw new Error(response.message || 'Failed to switch firm');
      }
    } catch (error) {
      // Silently handle errors - toast will show user-friendly message
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

