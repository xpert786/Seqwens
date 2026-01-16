import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getBusinessSuggestions } from '../utils/businessCodes';

// Simple cache for search results
const searchCache = new Map();
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

const BusinessAutocomplete = ({
  value,
  onChange,
  placeholder = "Start typing your business type...",
  className = "",
  error = false,
  disabled = false
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Check if cache entry is still valid
  const isCacheValid = useCallback((cacheEntry) => {
    return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
  }, []);

  // Get cached results or null if not available/expired
  const getCachedResults = useCallback((searchTerm) => {
    const cacheEntry = searchCache.get(searchTerm);
    if (isCacheValid(cacheEntry)) {
      return cacheEntry.data;
    }
    return null;
  }, [isCacheValid]);

  // Cache search results
  const setCachedResults = useCallback((searchTerm, results) => {
    searchCache.set(searchTerm, {
      data: results,
      timestamp: Date.now()
    });
  }, []);

  // Debounced search function with caching
  const performSearch = useCallback(async (searchTerm) => {
    console.log('BusinessAutocomplete: performSearch called with:', searchTerm);
    if (!searchTerm || searchTerm.length < 2) {
      console.log('BusinessAutocomplete: Search term too short, clearing suggestions');
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cachedResults = getCachedResults(searchTerm);
    if (cachedResults) {
      console.log('BusinessAutocomplete: Using cached results for:', searchTerm, cachedResults);
      setSuggestions(cachedResults);
      setShowSuggestions(cachedResults.length > 0);
      setSelectedIndex(-1);
      setIsLoading(false);
      return;
    }

    console.log('BusinessAutocomplete: Making API call for:', searchTerm);
    setIsLoading(true);
    try {
      const newSuggestions = await getBusinessSuggestions(searchTerm);
      console.log('BusinessAutocomplete: API returned:', newSuggestions);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
      setSelectedIndex(-1);

      // Cache the results
      setCachedResults(searchTerm, newSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, [getCachedResults, setCachedResults]);

  // Cleanup expired cache entries periodically
  useEffect(() => {
    const cleanupCache = () => {
      const now = Date.now();
      for (const [key, entry] of searchCache.entries()) {
        if ((now - entry.timestamp) >= CACHE_DURATION) {
          searchCache.delete(key);
        }
      }
    };

    // Cleanup every 5 minutes
    const cleanupInterval = setInterval(cleanupCache, 5 * 60 * 1000);

    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  // Debounced search effect when value changes from user input
  useEffect(() => {
    console.log('BusinessAutocomplete: useEffect triggered', { value, isSelecting, searchTimeout });

    // Don't search if we're in the middle of a selection
    if (isSelecting) {
      console.log('BusinessAutocomplete: Skipping search - isSelecting is true');
      // Ensure dropdown stays closed during selection
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Only search if value is not empty and has changed
    if (value && value.length >= 2) {
      console.log('BusinessAutocomplete: Setting up search for:', value);
      // Set new timeout for debounced search
      const timeout = setTimeout(() => {
        console.log('BusinessAutocomplete: Executing search for:', value);
        performSearch(value);
      }, 300); // 300ms debounce

      setSearchTimeout(timeout);

      // Cleanup timeout on unmount or when value changes
      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    } else {
      console.log('BusinessAutocomplete: Clearing suggestions - value too short or empty');
      // Clear suggestions if input is too short
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value, performSearch, isSelecting]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    console.log('BusinessAutocomplete: handleInputChange called with:', newValue);
    setSelectedIndex(-1);

    // Update parent with new value - the useEffect will handle search triggering
    if (onChange) {
      console.log('BusinessAutocomplete: Calling onChange with:', newValue);
      onChange(newValue);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    console.log('BusinessAutocomplete: handleSuggestionClick called with:', suggestion);

    // Store both the display text and the code ID for backend processing
    const selectedValue = suggestion.title || suggestion.displayText;
    const codeData = {
      text: selectedValue,
      codeId: suggestion.id,
      naicsCode: suggestion.naics_code || suggestion.code,
      category: suggestion.category
    };

    console.log('BusinessAutocomplete: Processing selection:', selectedValue, codeData);

    // Clear any pending search timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }

    // Set selecting flag to prevent search during selection
    setIsSelecting(true);

    // Immediately close suggestions and clear state
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setSuggestions([]); // Clear suggestions to prevent re-showing
    setIsLoading(false); // Clear loading state

    // Pass the selected code data to parent component
    if (onChange) {
      console.log('BusinessAutocomplete: Calling onChange with:', selectedValue, codeData);
      // For backward compatibility, pass the text, but also store code info if needed
      onChange(selectedValue, codeData);
    } else {
      console.log('BusinessAutocomplete: onChange is not defined!');
    }

    // Clear selecting flag after a longer delay to ensure parent update is complete
    setTimeout(() => {
      setIsSelecting(false);
    }, 200);
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
    // But don't hide if we're in the middle of a selection
    setTimeout(() => {
      if (!isSelecting) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }, 150);
  };

  return (
    <div className="position-relative">
      <input
        ref={inputRef}
        type="text"
        className={`form-control ${error ? 'is-invalid' : ''} ${className}`}
        placeholder={placeholder}
        value={value || ''}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        autoComplete="off"
        style={{ fontFamily: 'BasisGrotesquePro' }}
      />

      {isLoading && (value || '').length >= 2 && (
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
              onClick={(e) => {
                console.log('BusinessAutocomplete: Suggestion clicked:', suggestion);
                e.preventDefault();
                e.stopPropagation();
                handleSuggestionClick(suggestion);
              }}
              onMouseDown={(e) => {
                // Prevent blur from firing before click
                e.preventDefault();
              }}
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

      {(value || '').length >= 2 && suggestions.length === 0 && showSuggestions && !isLoading && (
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

