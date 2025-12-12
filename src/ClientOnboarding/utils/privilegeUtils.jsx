/**
 * Privilege utility functions for checking user permissions
 */

import { getUserData, getStorage } from './userUtils';

/**
 * Get custom role data from user data
 * @returns {Object|null} Custom role object with id, name, and privileges, or null
 */
export const getCustomRole = () => {
  try {
    // First check userData (from login response)
    const userData = getUserData();
    console.log('getCustomRole - userData:', userData);
    
    if (userData && userData.custom_role) {
      console.log('getCustomRole - Found in userData.custom_role:', userData.custom_role);
      return userData.custom_role;
    }
    
    // Fallback: check if stored separately in storage
    const storage = getStorage();
    const customRoleStr = storage?.getItem("customRole");
    console.log('getCustomRole - customRoleStr from storage:', customRoleStr);
    
    if (customRoleStr) {
      const parsed = JSON.parse(customRoleStr);
      console.log('getCustomRole - Parsed from storage:', parsed);
      return parsed;
    }
    
    console.log('getCustomRole - No custom role found');
    return null;
  } catch (error) {
    console.error('Error getting custom role:', error);
    return null;
  }
};

/**
 * Get user privileges from custom role
 * @returns {Array<string>} Array of privilege strings
 */
export const getUserPrivileges = () => {
  const customRole = getCustomRole();
  if (customRole && customRole.privileges && Array.isArray(customRole.privileges)) {
    return customRole.privileges;
  }
  return [];
};

/**
 * Check if user has a specific privilege
 * @param {string} privilege - The privilege to check (e.g., "staff.view.view_staff")
 * @returns {boolean} True if user has the privilege
 */
export const hasPrivilege = (privilege) => {
  const privileges = getUserPrivileges();
  return privileges.includes(privilege);
};

/**
 * Check if user has any privilege matching a pattern
 * @param {string} pattern - Pattern to match (e.g., "staff.view" or "staff.*")
 * @returns {boolean} True if user has any matching privilege
 */
export const hasPrivilegePattern = (pattern) => {
  const privileges = getUserPrivileges();
  
  if (privileges.length === 0) {
    console.log('hasPrivilegePattern: No privileges found');
    return false;
  }
  
  // Convert pattern to regex (e.g., "staff.*" becomes "^staff\\..*$")
  // IMPORTANT: Escape dots FIRST, then replace * with .*
  // This ensures "staff.*" becomes "^staff\\..*$" which matches "staff.assign.view_staff"
  const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
  const regex = new RegExp(`^${regexPattern}$`);
  
  console.log('hasPrivilegePattern:', {
    pattern,
    regexPattern,
    regex: regex.toString(),
    privileges,
    matches: privileges.filter(p => regex.test(p))
  });
  
  const hasMatch = privileges.some(privilege => regex.test(privilege));
  console.log('hasPrivilegePattern result:', hasMatch);
  
  return hasMatch;
};

/**
 * Check if user has any privilege in a category
 * @param {string} category - Category to check (e.g., "staff", "clients", "documents")
 * @returns {boolean} True if user has any privilege in the category
 */
export const hasCategoryPrivilege = (category) => {
  return hasPrivilegePattern(`${category}.*`);
};

/**
 * Check if user has a specific action in a category
 * @param {string} category - Category (e.g., "staff", "clients")
 * @param {string} action - Action (e.g., "view", "create", "edit", "delete")
 * @returns {boolean} True if user has the action in the category
 */
export const hasCategoryAction = (category, action) => {
  return hasPrivilegePattern(`${category}.${action}.*`);
};

/**
 * Check if user is using a custom role
 * @returns {boolean} True if user has a custom role
 */
export const isCustomRole = () => {
  return getCustomRole() !== null;
};

/**
 * Feature to privilege mapping
 * Maps sidebar features to required privilege patterns
 * Privilege format: {category}.{action}.{resource} (e.g., "staff.view.view_staff")
 */
export const FEATURE_PRIVILEGES = {
  dashboard: null, // Always visible
  clients: 'clients.*', // Matches any clients.* privilege
  documents: 'documents.*', // Matches any documents.* privilege
  tasks: 'tasks.*', // Matches any tasks.* privilege
  messages: 'communications.*', // Matches any communications.* privilege
  calendar: 'calendar.*', // Matches any calendar.* privilege (or appointments.*)
  eSignatures: 'signatures.*', // Matches any signatures.* or e_signatures.* privilege
  account: null, // Always visible
};

/**
 * Check if user has staff privileges (staff.* pattern)
 * Staff privileges grant access to all tax preparer features
 * @returns {boolean} True if user has any staff privilege
 */
export const hasStaffPrivileges = () => {
  const customRole = getCustomRole();
  console.log('hasStaffPrivileges - customRole:', customRole);
  
  const result = hasCategoryPrivilege('staff');
  console.log('hasStaffPrivileges result:', result);
  return result;
};

/**
 * Check if user can perform a specific action (based on staff privileges)
 * @param {string} action - Action to check (e.g., "view", "create", "edit", "delete", "assign")
 * @returns {boolean} True if user can perform the action
 */
export const canPerformAction = (action) => {
  // If no custom role, allow all actions
  if (!isCustomRole()) {
    return true;
  }
  
  // Check if user has staff privileges with the specific action
  // e.g., "staff.create.view_staff" means they can create
  return hasCategoryAction('staff', action);
};

/**
 * Check if user can view (read) content
 * @returns {boolean} True if user can view
 */
export const canView = () => {
  return canPerformAction('view');
};

/**
 * Check if user can create content
 * @returns {boolean} True if user can create
 */
export const canCreate = () => {
  return canPerformAction('create');
};

/**
 * Check if user can edit content
 * @returns {boolean} True if user can edit
 */
export const canEdit = () => {
  return canPerformAction('edit');
};

/**
 * Check if user can delete content
 * @returns {boolean} True if user can delete
 */
export const canDelete = () => {
  return canPerformAction('delete');
};

/**
 * Check if user can assign content (e.g., assign esign req and document requests to clients)
 * @returns {boolean} True if user can assign
 */
export const canAssign = () => {
  return canPerformAction('assign');
};

/**
 * Check if a feature should be visible based on privileges
 * @param {string} feature - Feature name (e.g., "clients", "documents")
 * @returns {boolean} True if feature should be visible
 */
export const isFeatureVisible = (feature) => {
  const hasCustomRole = isCustomRole();
  console.log(`isFeatureVisible(${feature}):`, {
    hasCustomRole,
    customRole: getCustomRole()
  });
  
  // If user doesn't have custom role, show all features (default behavior)
  if (!hasCustomRole) {
    console.log(`isFeatureVisible(${feature}): No custom role, showing feature`);
    return true;
  }
  
  // If user has staff privileges, show all tax preparer features
  // Staff privileges (staff.view, staff.create, etc.) grant access to all features
  const hasStaff = hasStaffPrivileges();
  console.log(`isFeatureVisible(${feature}): hasStaffPrivileges =`, hasStaff);
  
  if (hasStaff) {
    console.log(`isFeatureVisible(${feature}): Has staff privileges, showing feature`);
    return true;
  }
  
  const requiredPrivilege = FEATURE_PRIVILEGES[feature];
  
  // If no privilege required, always show
  if (!requiredPrivilege) {
    console.log(`isFeatureVisible(${feature}): No privilege required, showing feature`);
    return true;
  }
  
  // Check if user has the required privilege pattern
  const hasPrivilege = hasPrivilegePattern(requiredPrivilege);
  console.log(`isFeatureVisible(${feature}): Required privilege "${requiredPrivilege}", hasPrivilege =`, hasPrivilege);
  
  return hasPrivilege;
};

