import React, { useState, useRef, useEffect } from 'react';

/**
 * TwoFactorCodeInput - A component for entering 6-digit 2FA codes
 * Features:
 * - Auto-advance between input fields
 * - Paste support for 6-digit codes
 * - Backspace navigation
 * - Validation
 */
export default function TwoFactorCodeInput({ 
  value = '', 
  onChange, 
  onComplete,
  error = null,
  disabled = false,
  autoFocus = true,
  uiHints = null
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const inputRefs = useRef([]);

  // Get UI hints with defaults
  const getHints = () => {
    if (uiHints) {
      return {
        backgroundColor: uiHints.backgroundColor || '#ffffff',
        textColor: uiHints.textColor || '#000000',
        borderColor: uiHints.borderColor || '#007bff',
        focusBorderColor: uiHints.focusBorderColor || '#0056b3',
        errorColor: uiHints.errorColor || '#dc3545',
        successColor: uiHints.successColor || '#28a745',
        inputPlaceholder: uiHints.inputPlaceholder || 'Enter 6-digit code',
      };
    }
    // Default values
    return {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      borderColor: '#007bff',
      focusBorderColor: '#0056b3',
      errorColor: '#dc3545',
      successColor: '#28a745',
      inputPlaceholder: 'Enter 6-digit code',
    };
  };

  const hints = getHints();

  // Initialize digits from value prop
  useEffect(() => {
    if (value && value.length === 6) {
      const newDigits = value.split('').slice(0, 6);
      setDigits([...newDigits, ...Array(6 - newDigits.length).fill('')]);
    } else if (!value) {
      setDigits(['', '', '', '', '', '']);
    }
  }, [value]);

  // Focus first input on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index, newValue) => {
    // Only allow digits
    if (newValue && !/^\d$/.test(newValue)) {
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = newValue;
    setDigits(newDigits);

    // Create the full code string
    const code = newDigits.join('');
    
    // Call onChange with the full code
    if (onChange) {
      onChange(code);
    }

    // Auto-advance to next input if a digit was entered
    if (newValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits are filled, call onComplete
    if (code.length === 6 && onComplete) {
      onComplete(code);
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (digits[index]) {
        // If current field has a value, clear it
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
        const code = newDigits.join('');
        if (onChange) {
          onChange(code);
        }
      } else if (index > 0) {
        // If current field is empty, move to previous and clear it
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        const code = newDigits.join('');
        if (onChange) {
          onChange(code);
        }
      }
    }
    // Handle arrow keys
    else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
    // Handle paste
    else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        // Extract only digits
        const digitsOnly = text.replace(/\D/g, '').slice(0, 6);
        if (digitsOnly.length === 6) {
          const newDigits = digitsOnly.split('');
          setDigits(newDigits);
          const code = newDigits.join('');
          if (onChange) {
            onChange(code);
          }
          if (onComplete) {
            onComplete(code);
          }
          // Focus last input
          inputRefs.current[5]?.focus();
        }
      }).catch(err => {
        console.error('Failed to read clipboard:', err);
      });
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    // Extract only digits
    const digitsOnly = pastedText.replace(/\D/g, '').slice(0, 6);
    if (digitsOnly.length === 6) {
      const newDigits = digitsOnly.split('');
      setDigits(newDigits);
      const code = newDigits.join('');
      if (onChange) {
        onChange(code);
      }
      if (onComplete) {
        onComplete(code);
      }
      // Focus last input
      inputRefs.current[5]?.focus();
    }
  };

  const getInputStyle = (index) => {
    const isFocused = focusedIndex === index;
    const hasError = error !== null;
    
    let borderColor = hints.borderColor;
    let borderWidth = '3px';
    let boxShadow = 'none';
    
    if (hasError) {
      borderColor = hints.errorColor;
      borderWidth = '3px';
    } else if (isFocused) {
      borderColor = hints.focusBorderColor;
      borderWidth = '3px';
      boxShadow = `0 0 0 4px rgba(0, 123, 255, 0.25)`;
    }
    
    return {
      width: '60px',
      height: '70px',
      fontSize: '28px',
      fontWeight: '600',
      fontFamily: 'BasisGrotesquePro',
      backgroundColor: hints.backgroundColor,
      color: hints.textColor,
      border: `${borderWidth} solid ${borderColor}`,
      borderRadius: '8px',
      textAlign: 'center',
      letterSpacing: '0.1em',
      outline: 'none',
      boxShadow: boxShadow,
      transition: 'all 0.2s ease',
      padding: '0',
      margin: '0 4px',
    };
  };

  return (
    <div style={{ width: '100%' }}>
      <div className="d-flex gap-2 justify-content-center mb-3" style={{ gap: '8px' }}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength="1"
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            disabled={disabled}
            className="form-control text-center"
            style={getInputStyle(index)}
            aria-label={`Digit ${index + 1} of 6`}
          />
        ))}
      </div>
      {error && (
        <div 
          className="text-center mb-2" 
          style={{ 
            fontSize: '14px', 
            fontFamily: 'BasisGrotesquePro',
            color: hints.errorColor,
            fontWeight: '500',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

