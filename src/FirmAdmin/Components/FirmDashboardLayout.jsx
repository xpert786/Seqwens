import React, { useState, useEffect } from 'react';
import { Outlet } from "react-router-dom";
import FirmHeader from './FirmHeader';
import FirmSidebar from './FirmSidebar';
import MaintenanceMode from '../../ClientOnboarding/components/MaintenanceMode';
import { SubscriptionStatusProvider } from '../Context/SubscriptionStatusContext';
import SubscriptionStatusBanner from './SubscriptionStatusBanner';
import ImpersonationBanner from './ImpersonationBanner';
import '../styles/FirmPortalColors.css';
import ForcedPasswordChangeModal from '../../components/ForcedPasswordChangeModal';
import { getImpersonationStatus } from '../../ClientOnboarding/utils/userUtils';


export default function FirmDashboardLayout() {
  const [sidebarWidth, setSidebarWidth] = useState('280px');
  const [isImpersonating, setIsImpersonating] = useState(false);


  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  // Check if screen is mobile (less than 768px) and close sidebar by default on mobile
  const isMobileScreen = () => window.innerWidth < 1130;  // Increased breakpoint for better tablet support
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobileScreen());

  // Check if screen is mobile/tablet size
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 1130;
      setIsMobile(mobile);
      // On mobile, sidebar should be closed by default if it was open from desktop
      if (mobile && isSidebarOpen && !isMobile) {
        setIsSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [isSidebarOpen, isMobile]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isSidebarOpen]);

  useEffect(() => {
    // Listen for sidebar width changes from FirmSidebar
    const handleSidebarWidthChange = (event) => {
      setSidebarWidth(event.detail.width);
    };

    window.addEventListener('sidebarWidthChange', handleSidebarWidthChange);
    return () => window.removeEventListener('sidebarWidthChange', handleSidebarWidthChange);
  }, []);

  // Apply primary color to buttons with orange color (#F56D2D) - handles Tailwind arbitrary values
  useEffect(() => {
    let isApplying = false; // Flag to prevent recursive calls

    const applyPrimaryColorToButtons = () => {
      // Prevent recursive calls
      if (isApplying) return;
      isApplying = true;

      try {
        const rootElement = document.getElementById('firm-admin-root') || document.documentElement;
        const primaryColor = getComputedStyle(rootElement)
          .getPropertyValue('--firm-primary-color')?.trim() || '#32B582';

        // Find all buttons in firm dashboard layout that haven't been processed
        const buttons = document.querySelectorAll('.firm-dashboard-layout button:not([data-primary-applied])');

        buttons.forEach(button => {
          // Skip buttons that should keep their colors (white, red, etc.)
          const classList = Array.from(button.classList);
          const hasExcludedClass = classList.some(cls =>
            cls.includes('bg-white') ||
            cls.includes('bg-gray') ||
            cls.includes('bg-red') ||
            cls.includes('bg-green') ||
            cls.includes('bg-blue') ||
            cls.includes('bg-yellow') ||
            cls.includes('bg-EF4444') || // Red buttons
            cls.includes('bg-10B981') // Green buttons
          );

          if (hasExcludedClass) {
            button.setAttribute('data-primary-applied', 'skip');
            return;
          }

          // Check if button has orange color (#F56D2D) in class name (Tailwind arbitrary value)
          const hasOrangeClass = button.className.includes('bg-[#F56D2D]') ||
            button.className.includes('bg-[#f56d2d]') ||
            button.className.includes('F56D2D');

          // Check inline style for orange color
          const inlineStyle = button.getAttribute('style') || '';
          const hasOrangeStyle = inlineStyle.includes('#F56D2D') ||
            inlineStyle.includes('#f56d2d') ||
            inlineStyle.includes('245, 109, 45');

          if (hasOrangeClass || hasOrangeStyle) {
            button.style.setProperty('background-color', `var(--firm-primary-color, ${primaryColor})`, 'important');
            button.style.setProperty('color', 'white', 'important');
            button.setAttribute('data-primary-applied', 'true');
          } else {
            // Mark as processed even if not orange to avoid re-checking
            button.setAttribute('data-primary-applied', 'checked');
          }
        });
      } finally {
        isApplying = false;
      }
    };

    // Apply on mount with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(applyPrimaryColorToButtons, 100);

    // Use MutationObserver to watch for new buttons (debounced with longer delay)
    let observerTimeout;
    let lastMutationTime = 0;
    const observer = new MutationObserver((mutations) => {
      // Only process mutations that add new nodes, ignore attribute changes we create
      const hasNewNodes = mutations.some(mutation =>
        mutation.type === 'childList' && mutation.addedNodes.length > 0
      );

      if (!hasNewNodes) return;

      const now = Date.now();
      // Debounce: only process if at least 500ms has passed since last mutation
      if (now - lastMutationTime < 500) return;
      lastMutationTime = now;

      clearTimeout(observerTimeout);
      observerTimeout = setTimeout(() => {
        applyPrimaryColorToButtons();
      }, 500);
    });

    const layoutElement = document.querySelector('.firm-dashboard-layout');
    if (layoutElement) {
      observer.observe(layoutElement, {
        childList: true,
        subtree: true
      });
    }

    // Listen for color changes (only on firm admin root, not on buttons)
    const colorObserver = new MutationObserver((mutations) => {
      // Only react to actual color variable changes, not our own attribute changes
      const rootElement = document.getElementById('firm-admin-root') || document.documentElement;
      const hasColorChange = mutations.some(mutation =>
        mutation.type === 'attributes' &&
        mutation.attributeName === 'style' &&
        mutation.target === rootElement
      );

      if (hasColorChange) {
        // Reset data attribute when colors change to re-apply (debounced)
        clearTimeout(observerTimeout);
        observerTimeout = setTimeout(() => {
          document.querySelectorAll('.firm-dashboard-layout button[data-primary-applied="true"]')
            .forEach(btn => {
              btn.removeAttribute('data-primary-applied');
            });
          applyPrimaryColorToButtons();
        }, 300);
      }
    });

    const rootElement = document.getElementById('firm-admin-root') || document.documentElement;
    colorObserver.observe(rootElement, {
      attributes: true,
      attributeFilter: ['style']
    });

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(observerTimeout);
      observer.disconnect();
      colorObserver.disconnect();
    };
  }, []);

  // Apply secondary color to all background colors throughout the panel
  useEffect(() => {
    let isApplying = false; // Flag to prevent recursive calls

    const applySecondaryColorToBackgrounds = () => {
      // Prevent recursive calls
      if (isApplying) return;
      isApplying = true;

      try {
        const rootElement = document.getElementById('firm-admin-root') || document.documentElement;
        const secondaryColor = getComputedStyle(rootElement)
          .getPropertyValue('--firm-secondary-color')?.trim() || '#F3F7FF';

        // Colors to replace with secondary color
        const colorsToReplace = [
          '#F3F7FF', '#f3f7ff', 'rgb(243, 247, 255)', 'rgb(243,247,255)',
          '#F6F7FF', '#f6f7ff', 'rgb(246, 247, 255)', 'rgb(246,247,255)'
        ];

        // Find all elements in firm dashboard layout that haven't been processed
        const allElements = document.querySelectorAll('.firm-dashboard-layout *:not([data-secondary-applied])');

        allElements.forEach(element => {
          // Skip buttons, inputs, and other form elements (they have their own styling)
          if (element.tagName === 'BUTTON' ||
            element.tagName === 'INPUT' ||
            element.tagName === 'SELECT' ||
            element.tagName === 'TEXTAREA' ||
            element.hasAttribute('data-primary-applied')) {
            element.setAttribute('data-secondary-applied', 'skip');
            return;
          }

          // Skip elements that should keep white background
          const classList = Array.from(element.classList);
          const shouldSkip = classList.some(cls =>
            cls.includes('bg-white') ||
            cls.includes('bg-gray') ||
            cls.includes('bg-red') ||
            cls.includes('bg-green') ||
            cls.includes('bg-blue') ||
            cls.includes('bg-yellow') ||
            cls.includes('bg-black') ||
            cls.includes('card') ||
            element.closest('button') ||
            element.closest('input')
          );

          if (shouldSkip) {
            element.setAttribute('data-secondary-applied', 'skip');
            return;
          }

          // Check computed style
          const computedStyle = window.getComputedStyle(element);
          const bgColor = computedStyle.backgroundColor;

          // Check if background color matches any of the colors to replace
          const matchesColor = colorsToReplace.some(color => {
            if (bgColor.includes(color) ||
              bgColor === color ||
              (color.startsWith('rgb') && bgColor.replace(/\s/g, '') === color.replace(/\s/g, ''))) {
              return true;
            }
            return false;
          });

          // Check class names for background color patterns
          const hasBgClass = classList.some(cls =>
            cls.includes('bg-[#F3F7FF]') ||
            cls.includes('bg-[#F6F7FF]') ||
            cls.includes('bg-[rgb(243,247,255)]') ||
            cls.includes('F3F7FF') ||
            cls.includes('F6F7FF') ||
            cls.includes('243,247,255')
          );

          // Check inline style
          const inlineStyle = element.getAttribute('style') || '';
          const hasBgStyle = colorsToReplace.some(color =>
            inlineStyle.includes(color) ||
            inlineStyle.includes(color.toLowerCase())
          );

          if (matchesColor || hasBgClass || hasBgStyle) {
            element.style.setProperty('background-color', `var(--firm-secondary-color, ${secondaryColor})`, 'important');
            element.setAttribute('data-secondary-applied', 'true');
          } else {
            // Mark as checked even if not matching to avoid re-checking
            element.setAttribute('data-secondary-applied', 'checked');
          }
        });
      } finally {
        isApplying = false;
      }
    };

    // Apply on mount with delay
    const timeoutId = setTimeout(applySecondaryColorToBackgrounds, 200);

    // Use MutationObserver to watch for new elements (debounced with longer delay)
    let observerTimeout;
    let lastMutationTime = 0;
    const observer = new MutationObserver((mutations) => {
      // Only process mutations that add new nodes, ignore attribute changes we create
      const hasNewNodes = mutations.some(mutation =>
        mutation.type === 'childList' && mutation.addedNodes.length > 0
      );

      if (!hasNewNodes) return;

      const now = Date.now();
      // Debounce: only process if at least 500ms has passed since last mutation
      if (now - lastMutationTime < 500) return;
      lastMutationTime = now;

      clearTimeout(observerTimeout);
      observerTimeout = setTimeout(() => {
        applySecondaryColorToBackgrounds();
      }, 500);
    });

    const layoutElement = document.querySelector('.firm-dashboard-layout');
    if (layoutElement) {
      observer.observe(layoutElement, {
        childList: true,
        subtree: true
      });
    }

    // Listen for color changes (only on firm admin root, not on elements)
    const colorObserver = new MutationObserver((mutations) => {
      // Only react to actual color variable changes, not our own attribute changes
      const rootElement = document.getElementById('firm-admin-root') || document.documentElement;
      const hasColorChange = mutations.some(mutation =>
        mutation.type === 'attributes' &&
        mutation.attributeName === 'style' &&
        mutation.target === rootElement
      );

      if (hasColorChange) {
        // Reset data attribute when colors change to re-apply (debounced)
        clearTimeout(observerTimeout);
        observerTimeout = setTimeout(() => {
          document.querySelectorAll('.firm-dashboard-layout [data-secondary-applied="true"]')
            .forEach(el => {
              el.removeAttribute('data-secondary-applied');
            });
          applySecondaryColorToBackgrounds();
        }, 300);
      }
    });

    const rootElement = document.getElementById('firm-admin-root') || document.documentElement;
    colorObserver.observe(rootElement, {
      attributes: true,
      attributeFilter: ['style']
    });

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(observerTimeout);
      observer.disconnect();
      colorObserver.disconnect();
    };
  }, []);

  // Check impersonation status periodically
  useEffect(() => {
    const checkStatus = () => {
      const { isImpersonating: impersonating } = getImpersonationStatus();
      setIsImpersonating(impersonating);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCloseSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <SubscriptionStatusProvider>
      <div className="firm-dashboard-layout">
        <MaintenanceMode />
        <ForcedPasswordChangeModal />
        <ImpersonationBanner />
        <FirmHeader
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          sidebarWidth={isMobile ? '0px' : sidebarWidth}
        />

        {/* Mobile/Tablet Overlay */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-[999] transition-opacity duration-300"
            onClick={handleCloseSidebar}
            aria-hidden="true"
          />
        )}

        <FirmSidebar
          isSidebarOpen={isSidebarOpen}
          isMobile={isMobile}
          isImpersonating={isImpersonating}
          onNavItemClick={handleCloseSidebar}
        />
        <div
          className="flex flex-col transition-all duration-300"
          style={{
            marginTop: isImpersonating ? '110px' : '70px',
            height: isImpersonating ? 'calc(100vh - 110px)' : 'calc(100vh - 70px)',
            marginLeft: (isSidebarOpen && !isMobile) ? sidebarWidth : '0',
            width: (isSidebarOpen && !isMobile) ? `calc(100% - ${sidebarWidth})` : '100%',
          }}
        >
          <SubscriptionStatusBanner />
          <main className="flex-grow overflow-y-auto p-2">
            <Outlet />
          </main>
        </div>
      </div>
    </SubscriptionStatusProvider>
  );
}
