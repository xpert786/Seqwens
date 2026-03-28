import React, { createContext, useContext, useState, useEffect } from 'react';
import { profileAPI } from '../../ClientOnboarding/utils/apiUtils';

const ThemeContext = createContext({
    isDarkMode: false,
    toggleTheme: () => { },
    isThemeLoading: false,
});

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    // Check localStorage for saved preference, default to dark mode
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('superadmin-theme');
        return saved === null ? true : saved === 'dark';
    });

    const [isThemeLoading, setIsThemeLoading] = useState(false);

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;

        if (isDarkMode) {
            root.classList.add('dark-mode');
            root.classList.add('dark'); // For Tailwind
            root.classList.remove('light-mode');
            // Set CSS variables for dark mode (True Dark)
            root.style.setProperty('--sa-bg-primary', '#000000');
            root.style.setProperty('--sa-bg-secondary', '#111111');
            root.style.setProperty('--sa-bg-card', '#0a0a0a');
            root.style.setProperty('--sa-bg-sidebar', '#000000');
            root.style.setProperty('--sa-bg-active', '#1f1f1f');
            root.style.setProperty('--sa-text-primary', '#ffffff');
            root.style.setProperty('--sa-text-secondary', '#d1d5db'); // Slate-300 for secondary
            root.style.setProperty('--sa-border-color', '#262626'); // Dark border
            root.style.setProperty('--sa-accent', '#f56d2d');
        } else {
            root.classList.remove('dark-mode');
            root.classList.remove('dark'); // For Tailwind
            root.classList.add('light-mode');
            // Set CSS variables for light mode
            root.style.setProperty('--sa-bg-primary', '#ffffff');
            root.style.setProperty('--sa-bg-secondary', '#f8f9fa');
            root.style.setProperty('--sa-bg-card', '#ffffff');
            root.style.setProperty('--sa-bg-sidebar', '#ffffff');
            root.style.setProperty('--sa-bg-active', '#f1f5f9');
            root.style.setProperty('--sa-text-primary', '#000000');
            root.style.setProperty('--sa-text-secondary', '#4b5563'); // Slate-600 for secondary
            root.style.setProperty('--sa-border-color', '#e5e7eb'); // Standard border
            root.style.setProperty('--sa-accent', '#f56d2d');
        }

        // Save to localStorage
        localStorage.setItem('superadmin-theme', isDarkMode ? 'dark' : 'light');

        // Cleanup function to remove theme classes and variables when provider unmounts (e.g., on logout)
        return () => {
            root.classList.remove('dark-mode', 'dark', 'light-mode');
            const varsToRemove = [
                '--sa-bg-primary', '--sa-bg-secondary', '--sa-bg-card',
                '--sa-bg-sidebar', '--sa-bg-active', '--sa-text-primary',
                '--sa-text-secondary', '--sa-border-color', '--sa-accent'
            ];
            varsToRemove.forEach(v => root.style.removeProperty(v));
        };
    }, [isDarkMode]);

    const toggleTheme = async () => {
        setIsThemeLoading(true);
        
        // Small delay to let the loader show before the heavy theme re-render
        setTimeout(async () => {
            const newMode = !isDarkMode;
            setIsDarkMode(newMode);
            
            // Sync with backend
            try {
                await profileAPI.updateUserAccount({
                    theme_preference: newMode ? 'dark' : 'light'
                });
            } catch (error) {
                console.error('Failed to sync theme with backend:', error);
            } finally {
                // Brief delay for smooth experience
                setTimeout(() => setIsThemeLoading(false), 800);
            }
        }, 100);
    };
    
    // Listen for storage changes in other tabs
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'superadmin-theme') {
                setIsDarkMode(e.newValue === 'dark');
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const value = {
        isDarkMode,
        toggleTheme,
        isThemeLoading,
    };

    return (
        <ThemeContext.Provider value={value}>
            {isThemeLoading && <ThemeLoader isDarkMode={isDarkMode} />}
            {children}
        </ThemeContext.Provider>
    );
};

// Internal Loader Component for Theme Switching
const ThemeLoader = ({ isDarkMode }) => {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
            backdropFilter: 'blur(5px)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            <div style={{
                position: 'relative',
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {/* Outer pulsing ring */}
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '2px solid #f56d2d',
                    opacity: '0.3',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }} />
                
                {/* Spinning loader */}
                <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    border: '3px solid transparent',
                    borderTopColor: '#f56d2d',
                    borderRightColor: '#f56d2d',
                    animation: 'spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite'
                }} />
            </div>
            
            <h3 style={{
                marginTop: '24px',
                color: isDarkMode ? '#f8fafc' : '#1e293b',
                fontSize: '18px',
                fontWeight: '600',
                letterSpacing: '-0.01em',
                fontFamily: "'BasisGrotesquePro', sans-serif"
            }}>
                {isDarkMode ? 'Illuminating...' : 'Embracing Shadows...'}
            </h3>
            
            <p style={{
                marginTop: '8px',
                color: isDarkMode ? '#94a3b8' : '#64748b',
                fontSize: '14px',
                fontWeight: '400'
            }}>
                Setting up your workspace
            </p>

            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); opacity: 0.3; }
                        50% { transform: scale(1.2); opacity: 0.1; }
                    }
                `}
            </style>
        </div>
    );
};

export default ThemeContext;
