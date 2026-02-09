// User utility functions

/**
 * Check if the current user is a new user
 * @returns {boolean} True if user is new, false if existing
 */
export const isNewUser = () => {
  const userData = getUserData();
  if (userData && typeof userData.onboarding_completed === 'boolean') {
    return !userData.onboarding_completed;
  }
  const userStatus = localStorage.getItem("userStatus"); // "new" or "existing"
  return userStatus === "new";
};

/**
 * Set user status in localStorage
 * @param {string} status - "new" or "existing"
 */
export const setUserStatus = (status) => {
  localStorage.setItem("userStatus", status);
};

/**
 * Get user data from appropriate storage (localStorage or sessionStorage)
 * @returns {Object|null} User data object or null if not found
 */
export const getUserData = () => {
  try {
    // Check the appropriate storage based on rememberMe setting
    const storage = getStorage();
    const userData = storage.getItem("userData");
    if (userData) {
      return JSON.parse(userData);
    }

    // Fallback: check both storages if not found in primary storage
    const localUserData = localStorage.getItem("userData");
    if (localUserData) {
      return JSON.parse(localUserData);
    }

    const sessionUserData = sessionStorage.getItem("userData");
    if (sessionUserData) {
      return JSON.parse(sessionUserData);
    }

    return null;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

/**
 * Set user data in localStorage
 * @param {Object} userData - User data object to store
 */
export const setUserData = (userData) => {
  localStorage.setItem("userData", JSON.stringify(userData));
};

/**
 * Clear user data from localStorage
 * @param {boolean} keepImpersonation - If true, preserves impersonation-related data (useful when starting impersonation)
 */
export const clearUserData = (keepImpersonation = false) => {
  console.log(`[USER_UTILS] clearUserData called (keepImpersonation=${keepImpersonation})`);

  // Core authentication data
  localStorage.removeItem("userData");
  localStorage.removeItem("userStatus");
  localStorage.removeItem("userType");
  localStorage.removeItem("customRole");

  // Only remove basic login markers if not transitioning to impersonation
  if (!keepImpersonation) {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("rememberMe");
  }

  localStorage.removeItem("rememberedEmail");
  localStorage.removeItem("userRegistrationData");
  localStorage.removeItem("resetEmail");
  localStorage.removeItem("resetOtp");

  // Firm-specific context
  localStorage.removeItem("firmLoginData");
  localStorage.removeItem("firmId");
  localStorage.removeItem("activeFirm");
  localStorage.removeItem("currentFirm");

  // Client/Taxpayer context that could cause navigation issues
  localStorage.removeItem("activeClient");
  localStorage.removeItem("selectedClient");
  localStorage.removeItem("currentClient");
  localStorage.removeItem("activeTaxpayer");
  localStorage.removeItem("selectedTaxpayer");
  localStorage.removeItem("currentTaxpayer");
  localStorage.removeItem("clientId");
  localStorage.removeItem("taxpayerId");

  // Role-specific context
  localStorage.removeItem("activeRole");
  localStorage.removeItem("currentRole");
  localStorage.removeItem("userRole");

  // Navigation/routing context
  localStorage.removeItem("lastRoute");
  localStorage.removeItem("previousRoute");
  localStorage.removeItem("redirectUrl");

  // Also clear from sessionStorage
  sessionStorage.removeItem("userData");
  sessionStorage.removeItem("userType");
  sessionStorage.removeItem("customRole");

  if (!keepImpersonation) {
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("rememberMe");
  }

  sessionStorage.removeItem("rememberedEmail");

  // Session storage - firm/client/taxpayer context
  sessionStorage.removeItem("firmLoginData");
  sessionStorage.removeItem("firmId");
  sessionStorage.removeItem("activeFirm");
  sessionStorage.removeItem("currentFirm");
  sessionStorage.removeItem("activeClient");
  sessionStorage.removeItem("selectedClient");
  sessionStorage.removeItem("currentClient");
  sessionStorage.removeItem("activeTaxpayer");
  sessionStorage.removeItem("selectedTaxpayer");
  sessionStorage.removeItem("currentTaxpayer");
  sessionStorage.removeItem("clientId");
  sessionStorage.removeItem("taxpayerId");
  sessionStorage.removeItem("activeRole");
  sessionStorage.removeItem("currentRole");
  sessionStorage.removeItem("userRole");
  sessionStorage.removeItem("lastRoute");
  sessionStorage.removeItem("previousRoute");
  sessionStorage.removeItem("redirectUrl");

  // Impersonation context - ONLY clear if not requested to keep
  if (!keepImpersonation) {
    console.log('[USER_UTILS] Wiping impersonation markers');
    localStorage.removeItem("impersonationInfo");
    localStorage.removeItem("superAdminImpersonationData");
    sessionStorage.removeItem("impersonationInfo");
    sessionStorage.removeItem("superAdminImpersonationData");
  } else {
    console.log('[USER_UTILS] Preserving impersonation markers', {
      hasLocal: !!localStorage.getItem('superAdminImpersonationData'),
      hasSession: !!sessionStorage.getItem('superAdminImpersonationData')
    });
  }
};


/**
 * Check if user is logged in
 * @returns {boolean} True if user is logged in
 */
export const isLoggedIn = () => {
  // Check sessionStorage first (current session)
  if (sessionStorage.getItem("isLoggedIn") === "true") {
    return true;
  }

  // Check localStorage (persistent sessions)
  if (localStorage.getItem("isLoggedIn") === "true") {
    return true;
  }

  return false;
};

/**
 * Get the appropriate storage based on rememberMe setting
 * @returns {Storage} localStorage or sessionStorage
 */
export const getStorage = () => {
  // Check sessionStorage first (current session preference)
  const sessionRememberMe = sessionStorage.getItem("rememberMe");
  if (sessionRememberMe !== null) {
    return sessionRememberMe === "true" ? localStorage : sessionStorage;
  }

  // Fallback to localStorage if no session preference
  const localRememberMe = localStorage.getItem("rememberMe");
  return localRememberMe === "true" ? localStorage : sessionStorage;
};

/**
 * Get access token from appropriate storage
 * @returns {string|null} Access token or null
 */
export const getAccessToken = () => {
  const storage = getStorage();
  return storage.getItem("accessToken");
};

/**
 * Get refresh token from appropriate storage
 * @returns {string|null} Refresh token or null
 */
export const getRefreshToken = () => {
  const storage = getStorage();
  return storage.getItem("refreshToken");
};

/**
 * Set tokens in appropriate storage
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 * @param {boolean} rememberMe - Whether to remember user
 */
export const setTokens = (accessToken, refreshToken, rememberMe) => {
  const storage = rememberMe ? localStorage : sessionStorage;

  // Clear tokens from both storages first
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("rememberMe");
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
  sessionStorage.removeItem("rememberMe");

  // Set tokens in appropriate storage
  storage.setItem("accessToken", accessToken);
  storage.setItem("refreshToken", refreshToken);
  storage.setItem("rememberMe", rememberMe.toString());
};

/**
 * Check if access token is expired
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = () => {
  const token = getAccessToken();
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return true;
  }
};

/**
 * Check if currently impersonating a firm
 * @returns {Object} { isImpersonating: boolean, info: Object|null }
 */
export const getImpersonationStatus = () => {
  // 1. Check markers in storage
  const impersonationData = localStorage.getItem('superAdminImpersonationData') || sessionStorage.getItem('superAdminImpersonationData');
  const infoStr = localStorage.getItem('impersonationInfo') || sessionStorage.getItem('impersonationInfo');

  let info = null;
  if (infoStr) {
    try {
      info = JSON.parse(infoStr);
    } catch (e) {
      console.error('Error parsing impersonation info:', e);
    }
  }

  // 2. Check tokens for impersonation claim (more robust)
  let tokenHasImpersonation = false;
  const token = getAccessToken();
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.is_impersonation) {
        tokenHasImpersonation = true;
      }
    } catch (e) {
      // Ignore token parsing errors
    }
  }

  // CRITICAL: isImpersonating should only be true if we have the data to REVERT
  // otherwise we'll show a banner that doesn't work.
  const isImpersonating = !!impersonationData && tokenHasImpersonation;

  return {
    isImpersonating,
    info: info,
    tokenClaim: tokenHasImpersonation,
    hasData: !!impersonationData
  };
};


/**
 * Store impersonation data in storage
 * @param {Object} originalSession - Original Super Admin session data
 * @param {Object} info - Impersonated firm info
 */
export const setImpersonationData = (originalSession, info) => {
  // Use both for maximum compatibility across logic
  const dataStr = JSON.stringify(originalSession);
  const infoStr = JSON.stringify(info);

  sessionStorage.setItem('superAdminImpersonationData', dataStr);
  sessionStorage.setItem('impersonationInfo', infoStr);

  localStorage.setItem('superAdminImpersonationData', dataStr);
  localStorage.setItem('impersonationInfo', infoStr);
};


/**
 * Handle the logic of reverting from impersonation back to Super Admin
 * This performs session restoration and returns true if successful
 * @returns {boolean} True if revert logic was successful
 */
export const performRevertToSuperAdmin = () => {
  try {
    const impersonationDataStr = localStorage.getItem('superAdminImpersonationData') || sessionStorage.getItem('superAdminImpersonationData');

    console.log('[IMPERSONATION_REVERT] Attempting revert', {
      hasData: !!impersonationDataStr,
      localExists: !!localStorage.getItem('superAdminImpersonationData'),
      sessionExists: !!sessionStorage.getItem('superAdminImpersonationData')
    });

    if (!impersonationDataStr) {
      console.error('[IMPERSONATION_REVERT] Original session data not found');
      return false;
    }



    const sessionData = JSON.parse(impersonationDataStr);

    // STEP 1: Hard reset - Clear ALL current context
    clearUserData();

    // STEP 2: Restore Super Admin session data
    // Clear everything first to ensure clean slate
    localStorage.clear();
    sessionStorage.clear();

    // Restore localStorage data
    if (sessionData.accessToken) localStorage.setItem('accessToken', sessionData.accessToken);
    if (sessionData.refreshToken) localStorage.setItem('refreshToken', sessionData.refreshToken);
    if (sessionData.userData) localStorage.setItem('userData', sessionData.userData);
    if (sessionData.userType) localStorage.setItem('userType', sessionData.userType);
    if (sessionData.isLoggedIn) localStorage.setItem('isLoggedIn', sessionData.isLoggedIn);
    if (sessionData.rememberMe) localStorage.setItem('rememberMe', sessionData.rememberMe);

    // Restore sessionStorage data
    if (sessionData.sessionAccessToken) sessionStorage.setItem('accessToken', sessionData.sessionAccessToken);
    if (sessionData.sessionRefreshToken) sessionStorage.setItem('refreshToken', sessionData.sessionRefreshToken);
    if (sessionData.sessionUserData) sessionStorage.setItem('userData', sessionData.sessionUserData);
    if (sessionData.sessionUserType) sessionStorage.setItem('userType', sessionData.sessionUserType);
    if (sessionData.sessionIsLoggedIn) sessionStorage.setItem('isLoggedIn', sessionData.sessionIsLoggedIn);
    if (sessionData.sessionRememberMe) sessionStorage.setItem('rememberMe', sessionData.sessionRememberMe);

    // STEP 3: Clear impersonation markers (they shouldn't exist after sessionStorage.clear() but for safety)
    sessionStorage.removeItem('superAdminImpersonationData');
    sessionStorage.removeItem('impersonationInfo');

    return true;
  } catch (error) {
    console.error('[IMPERSONATION_REVERT] Error during revert:', error);
    return false;
  }
};


