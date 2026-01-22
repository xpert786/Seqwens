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
            root.classList.add('dark'); // For Tailwind
            root.classList.remove('light-mode');
            // Set CSS variables for dark mode
            root.style.setProperty('--sa-bg-primary', '#0f172a');
            root.style.setProperty('--sa-bg-secondary', '#1e293b');
            root.style.setProperty('--sa-bg-card', '#1e293b');
            root.style.setProperty('--sa-bg-sidebar', '#0f172a');
            root.style.setProperty('--sa-bg-active', '#334155');
            root.style.setProperty('--sa-text-primary', '#f8fafc');
            root.style.setProperty('--sa-text-secondary', '#94a3b8');
            root.style.setProperty('--sa-border-color', '#334155');
            root.style.setProperty('--sa-accent', '#f56d2d');
        } else {
            root.classList.remove('dark-mode');
            root.classList.remove('dark'); // For Tailwind
            root.classList.add('light-mode');
            // Set CSS variables for light mode
            root.style.setProperty('--sa-bg-primary', '#ffffff');
            root.style.setProperty('--sa-bg-secondary', '#f3f7ff');
            root.style.setProperty('--sa-bg-card', '#ffffff');
            root.style.setProperty('--sa-bg-sidebar', '#ffffff');
            root.style.setProperty('--sa-bg-active', '#f1f5f9');
            root.style.setProperty('--sa-text-primary', '#1e293b');
            root.style.setProperty('--sa-text-secondary', '#64748b');
            root.style.setProperty('--sa-border-color', '#e2e8f0');
            root.style.setProperty('--sa-accent', '#f56d2d');
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
