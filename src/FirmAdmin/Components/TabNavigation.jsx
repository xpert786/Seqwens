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
  const defaultTabClassName = "px-1 py-1 text-[6px] sm:text-[4px] md:text-[6px] text-center flex-shrink-0 min-w-0 h-8 sm:h-10 md:h-12 flex items-center justify-center gap-1";
  const defaultActiveTabClassName = "bg-[#3AD6F2] text-white";
  const defaultInactiveTabClassName = "text-black hover:text-black";

  return (
    <div className={`border-2 border-[#E8F0FF] bg-white rounded-lg p-0.5 sm:p-1 ${className}`}>
      <nav className="flex gap-0.5 overflow-x-auto scrollbar-hide">
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
            <div dangerouslySetInnerHTML={{ __html: tab.replace(/\n/g, '<br/>') }} />
          </button>
        ))}
      </nav>
    </div>
  );
};

export default TabNavigation;
