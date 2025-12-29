/**
 * Date formatting utilities for consistent date input handling across the application
 * Formats dates as MM/DD/YYYY with automatic slash insertion
 */

/**
 * Format date input with automatic slashes (MM/DD/YYYY)
 * Removes all non-digit characters and adds slashes automatically
 * @param {string} value - The input value
 * @returns {string} - Formatted date string (MM/DD/YYYY)
 */
export const formatDateInput = (value) => {
  if (!value) return '';
  
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Limit to 8 digits (MMDDYYYY)
  const limitedDigits = digits.slice(0, 8);
  
  // Add slashes after month (2 digits) and day (4 digits)
  let formatted = '';
  if (limitedDigits.length > 0) {
    formatted = limitedDigits.slice(0, 2);
    if (limitedDigits.length > 2) {
      formatted += '/' + limitedDigits.slice(2, 4);
    }
    if (limitedDigits.length > 4) {
      formatted += '/' + limitedDigits.slice(4, 8);
    }
  }
  
  return formatted;
};

/**
 * Format date from MM/DD/YYYY to YYYY-MM-DD for API calls
 * @param {string} dateString - Date string in MM/DD/YYYY format
 * @returns {string} - Date string in YYYY-MM-DD format
 */
export const formatDateForAPI = (dateString) => {
  if (!dateString) return '';

  // If already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // Try parsing MM/DD/YYYY or MM-DD-YYYY
  const parts = dateString.split(/[-\/]/);
  if (parts.length === 3) {
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    const year = parts[2];
    // Validate year is 4 digits
    if (year.length === 4) {
      return `${year}-${month}-${day}`;
    }
  }

  // Try parsing as Date object
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return dateString;
};

/**
 * Format date from YYYY-MM-DD to MM/DD/YYYY for display
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} - Date string in MM/DD/YYYY format
 */
export const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';

  // If already in MM/DD/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    return dateString;
  }

  // Try parsing YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const parts = dateString.split('-');
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
  }

  // Try parsing as Date object
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  return dateString;
};

/**
 * Validate date string in MM/DD/YYYY format
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if valid date, false otherwise
 */
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  // Check format MM/DD/YYYY
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    return false;
  }
  
  const parts = dateString.split('/');
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  // Validate month (1-12)
  if (month < 1 || month > 12) {
    return false;
  }
  
  // Validate day (1-31, will be checked against month later)
  if (day < 1 || day > 31) {
    return false;
  }
  
  // Validate year (reasonable range)
  if (year < 1900 || year > 2100) {
    return false;
  }
  
  // Create date object to validate actual date
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return false;
  }
  
  return true;
};

