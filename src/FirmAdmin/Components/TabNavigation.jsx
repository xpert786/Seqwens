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
  const defaultTabClassName = "px-0.5 py-1.5 text-[6px] whitespace-nowrap";
  const defaultActiveTabClassName = "bg-[#3AD6F2] text-white";
  const defaultInactiveTabClassName = "text-black hover:text-black";

  return (
    <div className={`border-2 border-[#E8F0FF] bg-white rounded-lg p-1 ${className}`}>
      <nav className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`${defaultTabClassName} ${tabClassName} ${
              activeTab === tab
                ? `${defaultActiveTabClassName} ${activeTabClassName}`
                : `${defaultInactiveTabClassName} ${inactiveTabClassName}`
            }`}
            style={{borderRadius: '7px'}}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default TabNavigation;
