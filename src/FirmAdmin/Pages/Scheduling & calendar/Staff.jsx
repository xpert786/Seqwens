import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { firmAdminCalendarAPI, firmAdminStaffAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import AddStaffModal from '../Staff/AddStaffModal';

export default function Staff() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);


  // Schedule form state
  const [scheduleData, setScheduleData] = useState({
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    workingDays: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    },
    appointmentTypes: {
      taxPreparation: false,
      consultation: false,
      auditSupport: false,
      training: false
    },
    maxDailyAppointments: 8
  });

  // Refs for time inputs
  const startTimeInputRef = useRef(null);
  const endTimeInputRef = useRef(null);

  // Helper function to convert 12-hour format to 24-hour format
  const convertTo24Hour = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  // Helper function to convert 24-hour format to 12-hour format
  const convertTo12Hour = (time24h) => {
    const [hours, minutes] = time24h.split(':');
    let hour = parseInt(hours, 10);
    const modifier = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour.toString().padStart(2, '0')}:${minutes} ${modifier}`;
  };



  // Navigation tabs
  const navTabs = ['Calendar', 'Appointments', 'Staff'];
  const tabPaths = {
    Calendar: '/firmadmin/calendar',
    Appointments: '/firmadmin/calendar/appointments',
    Staff: '/firmadmin/calendar/staff',
  };

  const activeTab = location.pathname.includes('/appointments') ? 'Appointments' :
    location.pathname.includes('/staff') ? 'Staff' : 'Calendar';

  const [selectedTab, setSelectedTab] = useState(activeTab);
  const [currentDate] = useState(new Date());
  const [statistics, setStatistics] = useState({
    scheduled_month: 0,
    completed: 0,
    no_show_rate: 0,
    avg_duration_display: '0m'
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const [staffData, setStaffData] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Function to fetch staff members
  const fetchStaff = async () => {
    try {
      setLoadingStaff(true);
      const response = await firmAdminStaffAPI.listBasicStaff();
      if (response.success && response.data?.staff_members) {
        setStaffData(response.data.staff_members);
      }
    } catch (error) {
      console.error('Error fetching staff members:', error);
      toast.error(handleAPIError(error) || 'Failed to load staff members');
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  // Fetch statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoadingStats(true);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const response = await firmAdminCalendarAPI.getCalendar({
          view: 'month',
          date: dateStr
        });

        if (response.success && response.data?.statistics) {
          setStatistics({
            scheduled_month: response.data.statistics.scheduled_month || 0,
            completed: response.data.statistics.completed || 0,
            no_show_rate: response.data.statistics.no_show_rate || 0,
            avg_duration_display: response.data.statistics.avg_duration_display || '0m'
          });
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
        toast.error(handleAPIError(error) || 'Failed to load statistics', {
          position: 'top-right',
          autoClose: 3000
        });
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStatistics();
  }, [currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()]);



  // Dynamic staff members derived from API data
  const staffMembers = staffData
    .filter(staff => staff.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    .map(staff => ({
      id: staff.id,
      name: staff.name,
      role: staff.role_display || staff.role,
      status: 'Available', // Default status for now
      initials: staff.name ? staff.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??'
    }));



  const getStatusColor = (status) => {
    return status === 'Available' ? 'bg-green-500' : 'bg-yellow-500';
  };

  // Metric cards data
  const metricCards = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 2V6" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 2V6" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 10H21" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      value: statistics.scheduled_month.toString(),
      label: 'Scheduled (month)'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      value: statistics.completed.toString(),
      label: 'Completed'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M9 1.25C7.74022 1.25 6.53204 1.75044 5.64124 2.64124C4.75045 3.53204 4.25 4.74022 4.25 6C4.25 7.25978 4.75045 8.46796 5.64124 9.35876C6.53204 10.2496 7.74022 10.75 9 10.75C10.2598 10.75 11.468 10.2496 12.3588 9.35876C13.2496 8.46796 13.75 7.25978 13.75 6C13.75 4.74022 13.2496 3.53204 12.3588 2.64124C11.468 1.75044 10.2598 1.25 9 1.25ZM5.75 6C5.75 5.13805 6.09241 4.3114 6.7019 3.7019C7.3114 3.09241 8.13805 2.75 9 2.75C9.86195 2.75 10.6886 3.09241 11.2981 3.7019C11.9076 4.3114 12.25 5.13805 12.25 6C12.25 6.86195 11.9076 7.6886 11.2981 8.2981C10.6886 8.90759 9.86195 9.25 9 9.25C8.13805 9.25 7.3114 8.90759 6.7019 8.2981C6.09241 7.6886 5.75 6.86195 5.75 6Z" fill="#00C0C6" />
          <path d="M15 2.25C14.8011 2.25 14.6103 2.32902 14.4697 2.46967C14.329 2.61032 14.25 2.80109 14.25 3C14.25 3.19891 14.329 3.38968 14.4697 3.53033C14.6103 3.67098 14.8011 3.75 15 3.75C15.5967 3.75 16.169 3.98705 16.591 4.40901C17.0129 4.83097 17.25 5.40326 17.25 6C17.25 6.59674 17.0129 7.16903 16.591 7.59099C16.169 8.01295 15.5967 8.25 15 8.25C14.8011 8.25 14.6103 8.32902 14.4697 8.46967C14.329 8.61032 14.25 8.80109 14.25 9C14.25 9.19891 14.329 9.38968 14.4697 9.53033C14.6103 9.67098 14.8011 9.75 15 9.75C15.9946 9.75 16.9484 9.35491 17.6517 8.65165C18.3549 7.94839 18.75 6.99456 18.75 6C18.75 5.00544 18.3549 4.05161 17.6517 3.34835C16.9484 2.64509 15.9946 2.25 15 2.25Z" fill="#00C0C6" />
          <path fillRule="evenodd" clipRule="evenodd" d="M3.678 13.52C5.078 12.72 6.961 12.25 9 12.25C11.039 12.25 12.922 12.72 14.322 13.52C15.7 14.308 16.75 15.51 16.75 17C16.75 18.49 15.7 19.692 14.322 20.48C12.922 21.28 11.039 21.75 9 21.75C6.961 21.75 5.078 21.28 3.678 20.48C2.3 19.692 1.25 18.49 1.25 17C1.25 15.51 2.3 14.308 3.678 13.52ZM4.422 14.823C3.267 15.483 2.75 16.28 2.75 17C2.75 17.72 3.267 18.517 4.422 19.177C5.556 19.825 7.173 20.25 9 20.25C10.827 20.25 12.444 19.825 13.578 19.177C14.733 18.517 15.25 17.719 15.25 17C15.25 16.281 14.733 15.483 13.578 14.823C12.444 14.175 10.827 13.75 9 13.75C7.173 13.75 5.556 14.175 4.422 14.823Z" fill="#00C0C6" />
          <path d="M18.1598 13.2673C17.9654 13.2248 17.7621 13.2614 17.5946 13.3688C17.4271 13.4763 17.3092 13.6459 17.2668 13.8403C17.2243 14.0347 17.2609 14.238 17.3683 14.4054C17.4758 14.5729 17.6454 14.6908 17.8398 14.7333C18.6318 14.9063 19.2648 15.2053 19.6828 15.5473C20.1008 15.8893 20.2498 16.2243 20.2498 16.5003C20.2498 16.7503 20.1298 17.0453 19.7968 17.3543C19.4618 17.6653 18.9468 17.9523 18.2838 18.1523C18.1894 18.1806 18.1016 18.2273 18.0253 18.2896C17.9489 18.3519 17.8856 18.4287 17.839 18.5154C17.7923 18.6022 17.7632 18.6973 17.7533 18.7954C17.7434 18.8934 17.7529 18.9924 17.7813 19.0868C17.8096 19.1811 17.8563 19.269 17.9186 19.3453C17.9809 19.4216 18.0577 19.4849 18.1445 19.5316C18.2312 19.5782 18.3263 19.6073 18.4244 19.6172C18.5224 19.6271 18.6214 19.6176 18.7158 19.5893C19.5388 19.3413 20.2738 18.9583 20.8178 18.4533C21.3638 17.9463 21.7498 17.2793 21.7498 16.5003C21.7498 15.6353 21.2758 14.9123 20.6328 14.3863C19.9888 13.8593 19.1218 13.4783 18.1598 13.2673Z" fill="#00C0C6" />
        </svg>
      ),
      value: `${statistics.no_show_rate}%`,
      label: 'No-show rate'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 13.0012L21.223 16.4832C21.2983 16.5333 21.3858 16.5621 21.4761 16.5664C21.5664 16.5707 21.6563 16.5505 21.736 16.5078C21.8157 16.4651 21.8824 16.4016 21.9289 16.324C21.9754 16.2464 22 16.1577 22 16.0672V7.87124C22 7.78326 21.9768 7.69684 21.9328 7.62069C21.8887 7.54454 21.8253 7.48136 21.7491 7.43754C21.6728 7.39372 21.5863 7.3708 21.4983 7.3711C21.4103 7.3714 21.324 7.3949 21.248 7.43924L16 10.5012" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 6H4C2.89543 6 2 6.89543 2 8V16C2 17.1046 2.89543 18 4 18H14C15.1046 18 16 17.1046 16 16V8C16 6.89543 15.1046 6 14 6Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      value: statistics.avg_duration_display,
      label: 'Avg. duration'
    }
  ];

  return (
    <div className="w-full px-6 py-6 bg-[#F6F7FF] min-h-screen">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-6">
          <div>
            <h4 className="text-2xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Firm Calendar</h4>
            <p className="text-gray-600 font-[BasisGrotesquePro]">Manage appointments, deadlines, and meetings</p>
          </div>
          <button
            onClick={() => setIsAddStaffModalOpen(true)}
            className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors flex items-center gap-2 font-[BasisGrotesquePro] mt-4 lg:mt-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Staff
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col lg:flex-row justify-between mb-6 items-start">
          <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-2">
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
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metricCards.map((card, index) => (
          <div key={index} className="bg-white !rounded-lg !border border-[#E8F0FF] pt-6 px-4 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <div className="text-[#3AD6F2] mb-2">{card.icon}</div>
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-4">{card.label}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] leading-none">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Staff Management Content */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsAddStaffModalOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-[#FF7142] transition font-[BasisGrotesquePro] flex items-center gap-2"
        >
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
                <button
                  onClick={() => navigate(`/firmadmin/staff/${staff.id}`)}
                  className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] whitespace-nowrap overflow-hidden"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setSelectedStaff(staff);
                    setIsScheduleModalOpen(true);
                  }}
                  className="flex-1 min-w-0 px-3 sm:px-4 py-1.5 sm:py-1 text-[10px] sm:text-sm font-medium text-white bg-[#F56D2D] !rounded-lg hover:bg-[#FF7142] transition font-[BasisGrotesquePro] whitespace-nowrap overflow-hidden"
                >
                  Schedule
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={isAddStaffModalOpen}
        onClose={() => setIsAddStaffModalOpen(false)}
        onInviteCreated={() => {
          // Optionally refresh staff list or show a message
          toast.success('Staff invitation sent successfully');
        }}
        onRefresh={fetchStaff}
      />

      {/* Schedule Modal */}
      {isScheduleModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-8" onClick={() => setIsScheduleModalOpen(false)}>
          <div className="bg-white rounded-lg p-3 w-full max-w-md mx-auto max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
              <h4 className="text-base sm:text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro]">
                Schedule For {selectedStaff.name}
              </h4>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                  <path d="M16.067 8.99502C16.1386 8.92587 16.1958 8.84314 16.2352 8.75165C16.2745 8.66017 16.2952 8.56176 16.2962 8.46218C16.2971 8.3626 16.2781 8.26383 16.2405 8.17164C16.2028 8.07945 16.1472 7.99568 16.0768 7.92523C16.0064 7.85478 15.9227 7.79905 15.8305 7.7613C15.7384 7.72354 15.6396 7.70452 15.54 7.70534C15.4404 7.70616 15.342 7.7268 15.2505 7.76606C15.159 7.80532 15.0762 7.86242 15.007 7.93402L12.001 10.939L8.99597 7.93402C8.92731 7.86033 8.84451 7.80123 8.75251 7.76024C8.66051 7.71925 8.5612 7.69721 8.4605 7.69543C8.35979 7.69365 8.25976 7.71218 8.16638 7.7499C8.07299 7.78762 7.98815 7.84376 7.91694 7.91498C7.84572 7.9862 7.78957 8.07103 7.75185 8.16442C7.71413 8.25781 7.69561 8.35784 7.69738 8.45854C7.69916 8.55925 7.7212 8.65856 7.76219 8.75056C7.80319 8.84256 7.86229 8.92536 7.93597 8.99402L10.939 12L7.93397 15.005C7.80149 15.1472 7.72937 15.3352 7.7328 15.5295C7.73623 15.7238 7.81494 15.9092 7.95235 16.0466C8.08977 16.1841 8.27515 16.2628 8.46945 16.2662C8.66375 16.2696 8.8518 16.1975 8.99397 16.065L12.001 13.06L15.006 16.066C15.1481 16.1985 15.3362 16.2706 15.5305 16.2672C15.7248 16.2638 15.9102 16.1851 16.0476 16.0476C16.185 15.9102 16.2637 15.7248 16.2671 15.5305C16.2706 15.3362 16.1985 15.1482 16.066 15.006L13.063 12L16.067 8.99502Z" fill="#3B4A66" />
                </svg>
              </button>
            </div>

            {/* Staff Member Info */}
            <div className="mb-2 flex-shrink-0">
              <label className="block text-[16px] font-medium text-[#4B5563] font-regular font-[BasisGrotesquePro] mb-1">
                Staff Member
              </label>
              <p className="text-sm text-[#1F2A55] font-[BasisGrotesquePro]">
                {selectedStaff.name} - {selectedStaff.role}
              </p>
            </div>

            {/* Modal Form - Scrollable */}
            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
              {/* Default Working Hours */}
              <div>
                <h6 className="text-[16px] font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-2">
                  Default Working Hours
                </h6>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[16px] font-medium text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
                      Start Time
                    </label>
                    <div className="relative">
                      <input
                        ref={startTimeInputRef}
                        type="time"
                        value={convertTo24Hour(scheduleData.startTime)}
                        onChange={(e) => setScheduleData({ ...scheduleData, startTime: convertTo12Hour(e.target.value) })}
                        className="w-full px-3 py-1.5 pr-10 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] placeholder:text-[#4B5563] placeholder:font-normal [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                        style={{ WebkitAppearance: 'none', appearance: 'none' }}
                      />
                      <svg
                        onClick={() => startTimeInputRef.current?.showPicker?.() || startTimeInputRef.current?.click()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 pointer-events-auto z-10"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[16px] font-medium text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
                      End Time
                    </label>
                    <div className="relative">
                      <input
                        ref={endTimeInputRef}
                        type="time"
                        value={convertTo24Hour(scheduleData.endTime)}
                        onChange={(e) => setScheduleData({ ...scheduleData, endTime: convertTo12Hour(e.target.value) })}
                        className="w-full px-3 py-1.5 pr-10 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] placeholder:text-[#4B5563] placeholder:font-normal [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                        style={{ WebkitAppearance: 'none', appearance: 'none' }}
                      />
                      <svg
                        onClick={() => endTimeInputRef.current?.showPicker?.() || endTimeInputRef.current?.click()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 pointer-events-auto z-10"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Working Days */}
              <div>
                <h6 className="text-[16px] font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-2">
                  Working Days
                </h6>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {Object.entries(scheduleData.workingDays).map(([day, checked]) => (
                    <label key={day} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setScheduleData({
                          ...scheduleData,
                          workingDays: { ...scheduleData.workingDays, [day]: e.target.checked }
                        })}
                        className="w-4 h-4 !rounded-lg !border-2 !border-[#3AD6F2] bg-white focus:outline-none cursor-pointer"
                      />
                      <span className="text-sm text-[#1F2A55] font-[BasisGrotesquePro] capitalize ml-3">
                        {day}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Appointment Types */}
              <div>
                <h6 className="text-[16px] font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-2">
                  Appointment Types
                </h6>
                <div className="flex flex-col space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleData.appointmentTypes.taxPreparation}
                      onChange={(e) => setScheduleData({
                        ...scheduleData,
                        appointmentTypes: { ...scheduleData.appointmentTypes, taxPreparation: e.target.checked }
                      })}
                      className="w-4 h-4 !rounded-lg !border-2 !border-[#3AD6F2] bg-white focus:outline-none cursor-pointer"
                    />
                    <span className="text-sm text-[#1F2A55] font-[BasisGrotesquePro] ml-3">
                      Tax Preparation
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleData.appointmentTypes.consultation}
                      onChange={(e) => setScheduleData({
                        ...scheduleData,
                        appointmentTypes: { ...scheduleData.appointmentTypes, consultation: e.target.checked }
                      })}
                      className="w-4 h-4 !rounded-lg !border-2 !border-[#3AD6F2] bg-white focus:outline-none cursor-pointer"
                    />
                    <span className="text-sm text-[#1F2A55] font-[BasisGrotesquePro] ml-3">
                      Consultation
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleData.appointmentTypes.auditSupport}
                      onChange={(e) => setScheduleData({
                        ...scheduleData,
                        appointmentTypes: { ...scheduleData.appointmentTypes, auditSupport: e.target.checked }
                      })}
                      className="w-4 h-4 !rounded-lg !border-2 !border-[#3AD6F2] bg-white focus:outline-none cursor-pointer"
                    />
                    <span className="text-sm text-[#1F2A55] font-[BasisGrotesquePro] ml-3">
                      Audit Support
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleData.appointmentTypes.training}
                      onChange={(e) => setScheduleData({
                        ...scheduleData,
                        appointmentTypes: { ...scheduleData.appointmentTypes, training: e.target.checked }
                      })}
                      className="w-4 h-4 !rounded-lg !border-2 !border-[#3AD6F2] bg-white focus:outline-none cursor-pointer"
                    />
                    <span className="text-sm text-[#1F2A55] font-[BasisGrotesquePro] ml-3">
                      Training
                    </span>
                  </label>
                </div>
              </div>

              {/* Maximum Daily Appointments */}
              <div>
                <h6 className="text-[16px] font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-2">
                  Maximum Daily Appointments
                </h6>
                <input
                  type="number"
                  value={scheduleData.maxDailyAppointments}
                  onChange={(e) => setScheduleData({ ...scheduleData, maxDailyAppointments: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] placeholder:text-[#4B5563] placeholder:font-normal"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 mt-2 flex-shrink-0">
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-3 py-1.5 text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Schedule Data:', scheduleData);
                  setIsScheduleModalOpen(false);
                }}
                className="px-3 py-1.5 text-sm font-medium text-white !bg-[#F56D2D] !rounded-lg hover:bg-[#FF7142] transition font-[BasisGrotesquePro]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}






    </div>
  );
}

