/**
 * Utility functions for formatting various fields
 */

/**
 * Format SSN/ITIN input (9 digits total, formatted as XXX-XX-XXXX)
 * @param {string} value - The input value
 * @returns {string} - Formatted string
 */
export const formatSSN = (value) => {
    if (!value) return '';

    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');

    // Limit to 9 digits
    const limitedDigits = digits.slice(0, 9);

    // Add dashes after 3rd and 5th digits
    let formatted = '';
    if (limitedDigits.length > 0) {
        formatted = limitedDigits.slice(0, 3);
        if (limitedDigits.length > 3) {
            formatted += '-' + limitedDigits.slice(3, 5);
        }
        if (limitedDigits.length > 5) {
            formatted += '-' + limitedDigits.slice(5, 9);
        }
    }

    return formatted;
};

/**
 * Validates if the string is a valid SSN/ITIN (9 digits)
 * @param {string} value - The input value
 * @returns {boolean} - True if valid
 */
export const isValidSSN = (value) => {
    if (!value) return false;
    const digits = value.replace(/\D/g, '');
    return digits.length === 9;
};
