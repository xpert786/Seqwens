import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getBusinessSuggestions } from '../utils/businessCodes';

const BusinessAutocomplete = ({
  value,
  onChange,
  placeholder = "Start typing your business type...",
  className = "",
  error = false,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Debounced search function
  const performSearch = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const newSuggestions = await getBusinessSuggestions(searchTerm);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      performSearch(inputValue);
    }, 300); // 300ms debounce

    setSearchTimeout(timeout);

    // Cleanup timeout on unmount or when inputValue changes
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [inputValue, performSearch]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);

    // If user is typing and it's not from selection, update parent immediately
    // This allows free text entry while suggestions are loading
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    // Store both the display text and the code ID for backend processing
    const selectedValue = suggestion.title || suggestion.displayText;
    const codeData = {
      text: selectedValue,
      codeId: suggestion.id,
      naicsCode: suggestion.naics_code || suggestion.code,
      category: suggestion.category
    };

    setInputValue(selectedValue);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    // Pass the selected code data to parent component
    if (onChange) {
      // For backward compatibility, pass the text, but also store code info if needed
      onChange(selectedValue, codeData);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = (e) => {
    // Delay hiding suggestions to allow for clicks on suggestions
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 150);
  };

  return (
    <div className="position-relative">
      <input
        ref={inputRef}
        type="text"
        className={`form-control ${error ? 'is-invalid' : ''} ${className}`}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        autoComplete="off"
        style={{ fontFamily: 'BasisGrotesquePro' }}
      />

      {isLoading && inputValue.length >= 2 && (
        <div
          className="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-sm"
          style={{
            zIndex: 1050,
            fontFamily: 'BasisGrotesquePro'
          }}
        >
          <div className="px-3 py-2 text-muted small d-flex align-items-center">
            <div className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            Searching business codes...
          </div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && !isLoading && (
        <div
          ref={suggestionsRef}
          className="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-sm"
          style={{
            zIndex: 1050,
            maxHeight: '200px',
            overflowY: 'auto',
            fontFamily: 'BasisGrotesquePro'
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.id || suggestion.code}-${index}`}
              className={`px-3 py-2 cursor-pointer ${
                index === selectedIndex
                  ? 'bg-primary text-white'
                  : 'bg-white text-dark hover-bg-light'
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              style={{ cursor: 'pointer' }}
            >
              <div className="fw-medium">
                {suggestion.title || suggestion.displayText}
              </div>
              <div className={`small ${index === selectedIndex ? 'text-white-50' : 'text-muted'}`}>
                NAICS: {suggestion.naics_code || suggestion.code} • {suggestion.category || suggestion.scheduleC}
              </div>
              {suggestion.description && (
                <div className={`small mt-1 ${index === selectedIndex ? 'text-white-75' : 'text-muted'}`}>
                  {suggestion.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {inputValue.length >= 2 && suggestions.length === 0 && showSuggestions && !isLoading && (
        <div
          className="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-sm"
          style={{
            zIndex: 1050,
            fontFamily: 'BasisGrotesquePro'
          }}
        >
          <div className="px-3 py-2 text-muted small">
            No matching business codes found. You can still enter your description manually.
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessAutocomplete;

