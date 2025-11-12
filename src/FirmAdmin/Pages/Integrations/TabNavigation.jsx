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
  const defaultTabClassName = "px-4 py-2 text-sm font-medium text-center flex-shrink-0 min-w-0 flex items-center justify-center transition-all duration-200 font-[BasisGrotesquePro]";
  const defaultActiveTabClassName = "bg-[#3AD6F2] text-white !rounded-lg";
  const defaultInactiveTabClassName = "text-[#1F2A55]";

  return (
    <div className={`bg-white !rounded-lg p-2 border border-[#E8F0FF] inline-flex ${className}`}>
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

