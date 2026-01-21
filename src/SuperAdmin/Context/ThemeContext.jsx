import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
    isDarkMode: false,
    toggleTheme: () => { },
});

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    // Check localStorage for saved preference, default to light mode
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('superadmin-theme');
        return saved === 'dark';
    });

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;

        if (isDarkMode) {
            root.classList.add('dark-mode');
            root.classList.remove('light-mode');
            // Set CSS variables for dark mode
            root.style.setProperty('--sa-bg-primary', '#1a1a2e');
            root.style.setProperty('--sa-bg-secondary', '#16213e');
            root.style.setProperty('--sa-bg-card', '#1f2937');
            root.style.setProperty('--sa-text-primary', '#ffffff');
            root.style.setProperty('--sa-text-secondary', '#9ca3af');
            root.style.setProperty('--sa-border-color', '#374151');
        } else {
            root.classList.remove('dark-mode');
            root.classList.add('light-mode');
            // Set CSS variables for light mode
            root.style.setProperty('--sa-bg-primary', '#ffffff');
            root.style.setProperty('--sa-bg-secondary', '#f3f4f6');
            root.style.setProperty('--sa-bg-card', '#ffffff');
            root.style.setProperty('--sa-text-primary', '#1f2937');
            root.style.setProperty('--sa-text-secondary', '#6b7280');
            root.style.setProperty('--sa-border-color', '#e5e7eb');
        }

        // Save to localStorage
        localStorage.setItem('superadmin-theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(prev => !prev);
    };

    const value = {
        isDarkMode,
        toggleTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
