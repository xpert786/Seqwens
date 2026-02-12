import React, { useState } from 'react';

const getTabIconPath = (tabName) => {
  switch (tabName) {
    case 'General':
      return "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
    case 'Business':
      return "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4";
    case 'Services':
      return "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4";
    case 'Integrations':
      return "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1";
    case 'Advanced':
      return "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z";
    case 'Branding':
      return "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.5a2 2 0 00-1 .267";
    default:
      return null;
  }
};

const TabNavigation = ({
  tabs,
  activeTab,
  onTabChange,
  className = "",
  tabClassName = "",
  activeTabClassName = "",
  inactiveTabClassName = ""
}) => {
  const [hoveredTab, setHoveredTab] = useState(null);
  const defaultTabClassName = "px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-medium text-center flex-1 whitespace-nowrap flex items-center justify-center gap-3 transition-all duration-200 font-[BasisGrotesquePro]";
  const defaultActiveTabClassName = "text-white !rounded-lg";
  const defaultInactiveTabClassName = "text-[#1F2A55]";

  return (
    <div className={`bg-white !rounded-lg p-1 sm:p-2 border border-[#E8F0FF] w-full ${className}`}>
      <nav className="flex gap-3 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          const isHovered = hoveredTab === tab;
          const iconPath = getTabIconPath(tab);

          // Icon Color Logic:
          // 1. If active: White (#ffffff)
          // 2. If hovered: Dark theme color (#1F2A55)
          // 3. Otherwise: Primary color
          const iconColor = isActive ? '#ffffff' : (isHovered ? 'var(--firm-primary-color, #3AD6F2)' : 'var(--firm-primary-color, #3AD6F2)');

          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              onMouseEnter={() => !isActive && setHoveredTab(tab)}
              onMouseLeave={() => setHoveredTab(null)}
              className={`${defaultTabClassName} ${tabClassName} ${isActive
                ? `${defaultActiveTabClassName} ${activeTabClassName}`
                : `${defaultInactiveTabClassName} ${inactiveTabClassName}`
                }`}
              style={{
                backgroundColor: isActive ? 'var(--firm-primary-color, #3AD6F2)' : 'transparent',
                color: isActive ? 'white' : (isHovered ? 'var(--firm-primary-color, #3AD6F2)' : undefined),
                cursor: isActive ? 'default' : 'pointer',
                pointerEvents: isActive ? 'none' : 'auto'
              }}
            >
              {iconPath && (
                <svg
                  className="w-4 h-4 transition-all flex-shrink-0"
                  fill="none"
                  stroke={iconColor}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={iconPath} />
                </svg>
              )}
              {tab}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabNavigation;
