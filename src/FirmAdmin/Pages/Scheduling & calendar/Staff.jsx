import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Staff() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Navigation tabs
  const navTabs = ['Calendar', 'Appointments', 'Features', 'Staff'];
  const tabPaths = {
    Calendar: '/firmadmin/calendar',
    Appointments: '/firmadmin/calendar/appointments',
    Features: null,
    Staff: '/firmadmin/calendar/staff',
  };

  const activeTab = location.pathname.includes('/appointments') ? 'Appointments' :
    location.pathname.includes('/features') ? 'Features' :
      location.pathname.includes('/staff') ? 'Staff' : 'Calendar';

  const [selectedTab, setSelectedTab] = useState(activeTab);

  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  // Mock staff data
  const staffMembers = [
    {
      id: 1,
      name: 'Sarah Miller',
      role: 'Senior Tax Preparer',
      status: 'Available',
      initials: 'SM'
    },
    {
      id: 2,
      name: 'Michael Brown',
      role: 'Tax Consultant',
      status: 'Available',
      initials: 'MB'
    },
    {
      id: 3,
      name: 'David Wilson',
      role: 'Audit Specialist',
      status: 'Away',
      initials: 'DW'
    },
    {
      id: 4,
      name: 'Emily Johnson',
      role: 'Training Coordinator',
      status: 'Available',
      initials: 'EJ'
    }
  ];

  // Staff assignment rules
  const assignmentRules = [
    {
      id: 1,
      title: 'Round-Robin Assignment',
      description: 'Distribute new leads evenly among available staff members.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.3337 7.33249C13.1706 6.1593 12.6264 5.07226 11.7848 4.23882C10.9431 3.40537 9.85083 2.87177 8.67611 2.72019C7.50138 2.56861 6.30941 2.80747 5.28379 3.39998C4.25818 3.99249 3.45582 4.90578 3.00033 5.99915M2.66699 3.33249V5.99915H5.33366M2.66699 8.66582C2.83003 9.83901 3.37428 10.926 4.2159 11.7595C5.05752 12.5929 6.14982 13.1265 7.32455 13.2781C8.49927 13.4297 9.69124 13.1908 10.7169 12.5983C11.7425 12.0058 12.5448 11.0925 13.0003 9.99915M13.3337 12.6658V9.99915H10.667" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
        </svg>

      ),
      checkboxLabel: 'Enable Round-Robin',
      buttonLabel: 'Configure Rules'
    },
    {
      id: 2,
      title: 'Client Choice',
      description: 'Allow clients to select their preferred staff during booking.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.6663 14V12.6667C10.6663 11.9594 10.3854 11.2811 9.88529 10.781C9.3852 10.281 8.70692 10 7.99967 10H3.99967C3.29243 10 2.61415 10.281 2.11406 10.781C1.61396 11.2811 1.33301 11.9594 1.33301 12.6667V14M10.6663 7.33333L11.9997 8.66667L14.6663 6M8.66634 4.66667C8.66634 6.13943 7.47243 7.33333 5.99967 7.33333C4.52691 7.33333 3.33301 6.13943 3.33301 4.66667C3.33301 3.19391 4.52691 2 5.99967 2C7.47243 2 8.66634 3.19391 8.66634 4.66667Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
        </svg>

      ),
      checkboxLabel: 'Enable Client Choice',
      buttonLabel: 'Manage Options'
    },
    {
      id: 3,
      title: 'Skill-Based Assignment',
      description: 'Auto-assign appointments based on staff skills and expertise.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.3438 5.65625C10.3438 4.36391 9.29234 3.3125 8 3.3125C6.70766 3.3125 5.65625 4.36391 5.65625 5.65625C5.65625 6.94859 6.70766 8 8 8C9.29234 8 10.3438 6.94859 10.3438 5.65625ZM8 7.0625C7.22459 7.0625 6.59375 6.43166 6.59375 5.65625C6.59375 4.88084 7.22459 4.25 8 4.25C8.77541 4.25 9.40625 4.88084 9.40625 5.65625C9.40625 6.43166 8.77541 7.0625 8 7.0625Z" fill="#3B4A66" />
          <path d="M12.9109 8.94327C13.8505 8.84677 14.5859 8.05064 14.5859 7.08592C14.5859 6.05636 13.7483 5.21873 12.7188 5.21873C11.6892 5.21873 10.8516 6.05636 10.8516 7.08592C10.8516 8.05133 11.588 8.84792 12.5286 8.94348C12.0241 8.97223 11.539 9.11517 11.1024 9.36314C9.42728 7.54461 6.57094 7.54661 4.89762 9.36311C4.46094 9.11523 3.97537 8.9723 3.47147 8.94348C4.41203 8.84789 5.14847 8.0513 5.14847 7.08592C5.14847 6.05636 4.31084 5.21873 3.28128 5.21873C2.25172 5.21873 1.41409 6.05636 1.41409 7.08592C1.41409 8.05064 2.1495 8.84677 3.08916 8.94327C1.36894 9.04311 0 10.474 0 12.2187V13.625C0 13.8839 0.209875 14.0937 0.46875 14.0937H3.78125C3.78125 14.3526 3.99113 14.5625 4.25 14.5625H11.75C12.0089 14.5625 12.2188 14.3526 12.2188 14.0937H15.5312C15.7901 14.0937 16 13.8839 16 13.625V12.2187C16 10.474 14.6311 9.04311 12.9109 8.94327ZM11.7891 7.08592C11.7891 6.5733 12.2061 6.15623 12.7188 6.15623C13.2314 6.15623 13.6484 6.5733 13.6484 7.08592C13.6484 7.59855 13.2314 8.01561 12.7188 8.01561C12.2061 8.01561 11.7891 7.59855 11.7891 7.08592ZM2.35156 7.08592C2.35156 6.5733 2.76863 6.15623 3.28125 6.15623C3.79387 6.15623 4.21094 6.5733 4.21094 7.08592C4.21094 7.59855 3.79387 8.01561 3.28125 8.01561C2.76863 8.01561 2.35156 7.59855 2.35156 7.08592ZM0.9375 13.1562V12.2187C0.9375 10.4705 2.79003 9.3428 4.33772 10.1263C3.57947 11.4483 3.82991 12.5766 3.78125 13.1562H0.9375ZM11.2812 13.625H4.71875V12.2187C4.71875 10.4095 6.19072 8.93748 8 8.93748C9.80928 8.93748 11.2812 10.4095 11.2812 12.2187V13.625ZM15.0625 13.1562H12.2188C12.1703 12.5791 12.4208 11.4487 11.6622 10.1261C13.2085 9.34277 15.0625 10.4699 15.0625 12.2187V13.1562ZM7.21544 2.6752C7.39847 2.85827 7.69528 2.8583 7.87834 2.6752L9.75334 0.800203C9.93641 0.617141 9.93641 0.320359 9.75334 0.137297C9.57031 -0.0457656 9.2735 -0.0457656 9.09044 0.137297L7.54688 1.68083L6.90956 1.04355C6.72653 0.860484 6.42972 0.860484 6.24666 1.04355C6.06359 1.22661 6.06359 1.52339 6.24666 1.70645L7.21544 2.6752Z" fill="#3B4A66" />
        </svg>

      ),
      checkboxLabel: 'Enable Skill-Based',
      buttonLabel: 'Set Up Skills'
    }
  ];

  const getStatusColor = (status) => {
    return status === 'Available' ? 'bg-green-500' : 'bg-yellow-500';
  };

  return (
    <div className="w-full px-6 py-6 bg-[#F6F7FF] min-h-screen">
      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-2 inline-block">
          <div className="flex gap-2">
            {navTabs.map((tab) => {
              const tabPath = tabPaths[tab];
              const isActive = selectedTab === tab;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setSelectedTab(tab);
                    if (tabPath && location.pathname !== tabPath) {
                      navigate(tabPath);
                    } else if (tabPath && location.pathname === tabPath) {
                      navigate(tabPath, { replace: true });
                    }
                  }}
                  className={`px-4 py-2 font-[BasisGrotesquePro] transition-colors !rounded-lg cursor-pointer ${isActive
                    ? 'bg-[#3AD6F2] !text-white font-semibold'
                    : 'bg-transparent hover:bg-gray-50 !text-black'
                    }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="text-2xl font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
            Staff Management
          </h4>
          <p className="text-sm text-[#7B8AB2] font-[BasisGrotesquePro]">
            Manage appointments, deadlines, and meetings
          </p>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-[#FF7142] transition font-[BasisGrotesquePro] flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2V14M2 8H14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Add Staff Member
        </button>
      </div>

      {/* Main White Box Container */}
      <div className="bg-white rounded-lg p-6 !border border-[#E8F0FF] mb-6">
        {/* Search and Filter */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm  !border border-[#E8F0FF] rounded-lg focus:outline-none font-[BasisGrotesquePro] bg-[#F3F7FF]"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.40473 6.83733C2.74673 5.59733 1.56406 4.23333 0.918059 3.46667C0.718059 3.22933 0.652726 3.05533 0.613393 2.74933C0.478726 1.70133 0.411393 1.17733 0.718726 0.838667C1.02606 0.5 1.56939 0.5 2.65606 0.5H10.3441C11.4307 0.5 11.9741 0.5 12.2814 0.838C12.5887 1.17667 12.5214 1.70067 12.3867 2.74867C12.3467 3.05467 12.2814 3.22867 12.0821 3.466C11.4354 4.234 10.2507 5.60067 8.58873 6.84267C8.51187 6.90247 8.44834 6.97765 8.4022 7.0634C8.35605 7.14915 8.3283 7.24358 8.32073 7.34067C8.15606 9.16133 8.00406 10.1587 7.90939 10.6627C7.75673 11.4773 6.60273 11.9673 5.98406 12.404C5.61606 12.664 5.16939 12.3547 5.12206 11.952C4.94504 10.4177 4.79524 8.88031 4.67273 7.34067C4.66588 7.24266 4.63848 7.14719 4.5923 7.06047C4.54613 6.97375 4.48222 6.89773 4.40473 6.83733Z" stroke="#4B5563" stroke-linecap="round" stroke-linejoin="round" />
            </svg>

            Filters
          </button>
        </div>

        {/* Staff Profiles Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {staffMembers.map((staff) => (
            <div key={staff.id} className="bg-white rounded-lg p-3 sm:p-4 !border border-[#E8F0FF] min-w-0 overflow-hidden">
              <div className="flex flex-col items-center text-center mb-3 sm:mb-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#F56D2D] flex items-center justify-center mb-2 sm:mb-3 flex-shrink-0">
                  <span className="text-white text-base sm:text-lg font-semibold font-[BasisGrotesquePro]">
                    {staff.initials}
                  </span>
                </div>
                <h6 className="text-xs sm:text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1 break-words">
                  {staff.name}
                </h6>
                <p className="text-[10px] sm:text-xs text-[#7B8AB2] font-[BasisGrotesquePro] mb-2 break-words">
                  {staff.role}
                </p>
                <span className={`inline-flex items-center px-2 py-0.5 sm:py-1 !rounded-full text-[10px] sm:text-xs font-medium text-white ${getStatusColor(staff.status)} whitespace-nowrap`}>
                  {staff.status}
                </span>
              </div>
              <div className="flex gap-1.5 sm:gap-2 min-w-0">
                <button className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] whitespace-nowrap overflow-hidden">
                  Edit
                </button>
                <button className="flex-1 min-w-0 px-3 sm:px-4 py-1.5 sm:py-1 text-[10px] sm:text-sm font-medium text-white bg-[#F56D2D] !rounded-lg hover:bg-[#FF7142] transition font-[BasisGrotesquePro] whitespace-nowrap overflow-hidden">
                  Schedule
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Assignment Rules Section */}
      <div className="bg-white rounded-lg p-6 !border border-[#E8F0FF]">
        <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-6">
          Staff Assignment Rules
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignmentRules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-lg p-4 !border border-[#E8F0FF]">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 mt-0.5">
                  {rule.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h6 className="text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
                    {rule.title}
                  </h6>
                </div>
              </div>

              <p className="text-sm text-[#4B5563] font-[BasisGrotesquePro] mb-4 ml-9">
                {rule.description}
              </p>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 !rounded !border border-[#3AD6F2] bg-white focus:outline-none cursor-pointer mt-6"
                  />
                  <span className="text-sm text-[#1F2A55] font-[BasisGrotesquePro] ml-3">
                    {rule.checkboxLabel}
                  </span>
                </label>

              </div>
              <button className="px-4 py-2 text-sm font-medium text-white !bg-[#F56D2D] !rounded-lg hover:bg-[#FF7142] transition font-[BasisGrotesquePro]">
                {rule.buttonLabel}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

