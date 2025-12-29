import React from 'react';
import { formatDateInput } from '../ClientOnboarding/utils/dateUtils';

/**
 * Reusable Date Input Component
 * Automatically formats input as MM/DD/YYYY with auto-slash insertion
 * 
 * @param {string} value - The current value
 * @param {function} onChange - onChange handler (receives formatted value)
 * @param {string} placeholder - Placeholder text (defaults to "mm/dd/yyyy")
 * @param {string} className - Additional CSS classes
 * @param {object} style - Inline styles
 * @param {boolean} required - Whether field is required
 * @param {object} ...props - Other input props
 */
const DateInput = ({ 
  value = '', 
  onChange, 
  placeholder = 'mm/dd/yyyy',
  className = '',
  style = {},
  required = false,
  ...props 
}) => {
  const handleChange = (e) => {
    const inputValue = e.target.value;
    const formattedValue = formatDateInput(inputValue);
    
    // Call onChange with formatted value
    if (onChange) {
      // Create a synthetic event with the formatted value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: formattedValue
        }
      };
      onChange(syntheticEvent);
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      style={style}
      required={required}
      maxLength={10} // MM/DD/YYYY = 10 characters
      {...props}
    />
  );
};

export default DateInput;

