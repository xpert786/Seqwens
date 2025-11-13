// User utility functions

/**
 * Check if the current user is a new user
 * @returns {boolean} True if user is new, false if existing
 */
export const isNewUser = () => {
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
 */
export const clearUserData = () => {
  localStorage.removeItem("userData");
  localStorage.removeItem("userStatus");
  localStorage.removeItem("userType");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("rememberMe");
  localStorage.removeItem("userRegistrationData");
  localStorage.removeItem("resetEmail");
  localStorage.removeItem("resetOtp");
  
  // Also clear from sessionStorage
  sessionStorage.removeItem("userData");
  sessionStorage.removeItem("userType");
  sessionStorage.removeItem("isLoggedIn");
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
  sessionStorage.removeItem("rememberMe");
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
