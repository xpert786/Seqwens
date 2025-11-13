import React from 'react';

const TabNavigation = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className = "",
  tabClassName = "",
  activeTabClassName = "",
  inactiveTabClassName = ""
}) => {
  const defaultTabClassName = "px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-center flex-shrink-0 whitespace-nowrap flex items-center justify-center transition-all duration-200 font-[BasisGrotesquePro]";
  const defaultActiveTabClassName = "bg-[#3AD6F2] text-white !rounded-lg";
  const defaultInactiveTabClassName = "text-[#1F2A55]";

  return (
    <div className={`bg-white !rounded-lg p-1 sm:p-2 border border-[#E8F0FF] w-full ${className}`}>
      <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`${defaultTabClassName} ${tabClassName} ${
              activeTab === tab
                ? `${defaultActiveTabClassName} ${activeTabClassName}`
                : `${defaultInactiveTabClassName} ${inactiveTabClassName}`
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default TabNavigation;

