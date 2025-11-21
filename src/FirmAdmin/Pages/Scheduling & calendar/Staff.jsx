import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { firmAdminCalendarAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

export default function Staff() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isConfigureRulesModalOpen, setIsConfigureRulesModalOpen] = useState(false);
  const [isManageOptionsModalOpen, setIsManageOptionsModalOpen] = useState(false);
  const [isSetUpSkillsModalOpen, setIsSetUpSkillsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [calendarDropdownOpen, setCalendarDropdownOpen] = useState(false);
  const [distributionMethodDropdownOpen, setDistributionMethodDropdownOpen] = useState(false);
  const [resetFrequencyDropdownOpen, setResetFrequencyDropdownOpen] = useState(false);
  const [defaultStaffSortingDropdownOpen, setDefaultStaffSortingDropdownOpen] = useState(false);
  const [skillMatchingRulesDropdownOpen, setSkillMatchingRulesDropdownOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Tax Preparer',
    calendarIntegration: 'Not Connected',
    active: false
  });

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

  // Dropdown options
  const roleOptions = ['Tax Preparer', 'Senior Tax Preparer', 'Tax Consultant', 'Audit Specialist', 'Training Coordinator'];
  const calendarOptions = ['Not Connected', 'Google Calendar', 'Outlook Calendar', 'Apple Calendar'];
  const distributionMethodOptions = ['Strict rotation', 'Weighted by capacity', 'Based on current workload'];
  const resetFrequencyOptions = ['Never (continuous rotation)', 'Daily', 'Weekly', 'Monthly'];
  const defaultStaffSortingOptions = ['By availability', 'Alphabetically', 'By expertise match', 'By rating'];
  const skillMatchingRulesOptions = ['Require exact match', 'Allow similar skills', 'Prioritize best match'];

  // Configure Rules form state
  const [configureRulesData, setConfigureRulesData] = useState({
    includeAllActiveStaff: false,
    excludeAwayStaff: false,
    distributionMethod: 'Strict rotation',
    resetFrequency: 'Never (continuous rotation)',
    appointmentTypeRules: {
      taxPreparation: 'All senior tax preparers',
      consultation: 'All available staff',
      auditSupport: 'Audit specialists only',
      training: 'Training coordinator only'
    }
  });

  // Manage Options form state
  const [manageOptionsData, setManageOptionsData] = useState({
    showStaffProfiles: true,
    showStaffRatings: false,
    allowFilteringByExpertise: false,
    defaultStaffSorting: 'By availability',
    selectedStaff: {
      sarahMiller: false,
      michaelBrown: false,
      davidWilson: false,
      emilyJohnson: false
    }
  });

  // Set Up Skills form state
  const [setUpSkillsData, setSetUpSkillsData] = useState({
    staffSkills: {
      sarahMiller: 'Tax Preparation, Individual Tax, Business Tax',
      michaelBrown: 'Tax Consultation, Tax Planning, International Tax',
      davidWilson: 'Audit Support, IRS Representation, Compliance',
      emilyJohnson: 'Training, Software Guidance, Client Education'
    },
    skillMatchingRule: 'Require exact match',
    requireExactMatch: false,
    autoUpdateSkills: true
  });

  // Navigation tabs
  const navTabs = ['Calendar', 'Appointments', 'Features', 'Staff'];
  const tabPaths = {
    Calendar: '/firmadmin/calendar',
    Appointments: '/firmadmin/calendar/appointments',
    Features: '/firmadmin/calendar/features',
    Staff: '/firmadmin/calendar/staff',
  };

  const activeTab = location.pathname.includes('/appointments') ? 'Appointments' :
    location.pathname.includes('/features') ? 'Features' :
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setRoleDropdownOpen(false);
        setCalendarDropdownOpen(false);
        setDistributionMethodDropdownOpen(false);
        setResetFrequencyDropdownOpen(false);
        setDefaultStaffSortingDropdownOpen(false);
        setSkillMatchingRulesDropdownOpen(false);
      }
    };

    if (roleDropdownOpen || calendarDropdownOpen || distributionMethodDropdownOpen || resetFrequencyDropdownOpen || defaultStaffSortingDropdownOpen || skillMatchingRulesDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [roleDropdownOpen, calendarDropdownOpen, distributionMethodDropdownOpen, resetFrequencyDropdownOpen, defaultStaffSortingDropdownOpen, skillMatchingRulesDropdownOpen]);

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
            onClick={() => setIsModalOpen(true)}
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
          onClick={() => setIsModalOpen(true)}
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
                <button className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] whitespace-nowrap overflow-hidden">
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
              <button 
                onClick={() => {
                  if (rule.id === 1) { // Round-Robin Assignment
                    setIsConfigureRulesModalOpen(true);
                  } else if (rule.id === 2) { // Client Choice
                    setIsManageOptionsModalOpen(true);
                  } else if (rule.id === 3) { // Skill-Based Assignment
                    setIsSetUpSkillsModalOpen(true);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white !bg-[#F56D2D] !rounded-lg hover:bg-[#FF7142] transition font-[BasisGrotesquePro]"
              >
                {rule.buttonLabel}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Staff Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-lg p-4 w-full max-w-xl mx-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-semibold text-[#1F2A55] font-[BasisGrotesquePro]">
                Add New Staff Member
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                  <path d="M16.067 8.99502C16.1386 8.92587 16.1958 8.84314 16.2352 8.75165C16.2745 8.66017 16.2952 8.56176 16.2962 8.46218C16.2971 8.3626 16.2781 8.26383 16.2405 8.17164C16.2028 8.07945 16.1472 7.99568 16.0768 7.92523C16.0064 7.85478 15.9227 7.79905 15.8305 7.7613C15.7384 7.72354 15.6396 7.70452 15.54 7.70534C15.4404 7.70616 15.342 7.7268 15.2505 7.76606C15.159 7.80532 15.0762 7.86242 15.007 7.93402L12.001 10.939L8.99597 7.93402C8.92731 7.86033 8.84451 7.80123 8.75251 7.76024C8.66051 7.71925 8.5612 7.69721 8.4605 7.69543C8.35979 7.69365 8.25976 7.71218 8.16638 7.7499C8.07299 7.78762 7.98815 7.84376 7.91694 7.91498C7.84572 7.9862 7.78957 8.07103 7.75185 8.16442C7.71413 8.25781 7.69561 8.35784 7.69738 8.45854C7.69916 8.55925 7.7212 8.65856 7.76219 8.75056C7.80319 8.84256 7.86229 8.92536 7.93597 8.99402L10.939 12L7.93397 15.005C7.80149 15.1472 7.72937 15.3352 7.7328 15.5295C7.73623 15.7238 7.81494 15.9092 7.95235 16.0466C8.08977 16.1841 8.27515 16.2628 8.46945 16.2662C8.66375 16.2696 8.8518 16.1975 8.99397 16.065L12.001 13.06L15.006 16.066C15.1481 16.1985 15.3362 16.2706 15.5305 16.2672C15.7248 16.2638 15.9102 16.1851 16.0476 16.0476C16.185 15.9102 16.2637 15.7248 16.2671 15.5305C16.2706 15.3362 16.1985 15.1482 16.066 15.006L13.063 12L16.067 8.99502Z" fill="#3B4A66" />
                </svg>

              </button>
            </div>

            {/* Modal Form */}
            <div className="space-y-2.5">
              {/* First Name */}
              <div>
                <label className="block text-[16px] font-medium text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] placeholder:text-[#4B5563] placeholder:font-normal"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-[16px] font-medium text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] placeholder:text-[#4B5563] placeholder:font-normal"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[16px] font-medium text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] placeholder:text-[#4B5563] placeholder:font-normal"
                />
              </div>

              {/* Role Dropdown */}
              <div className="relative dropdown-container">
                <label className="block text-[16px] font-medium text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
                  Role
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setRoleDropdownOpen(!roleDropdownOpen);
                      setCalendarDropdownOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] bg-white text-left flex items-center justify-between"
                  >
                    <span className="text-[#1F2A55]">{formData.role}</span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {roleDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-[#E8F0FF] rounded-lg shadow-lg">
                      {roleOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, role: option });
                            setRoleDropdownOpen(false);
                          }}
                          className="w-full px-3 py-1.5 text-sm text-left text-[#1F2A55] font-[BasisGrotesquePro] hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Calendar Integration Dropdown */}
              <div className="relative dropdown-container">
                <label className="block text-[16px] font-medium text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
                  Calendar Integration
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarDropdownOpen(!calendarDropdownOpen);
                      setRoleDropdownOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] bg-white text-left flex items-center justify-between"
                  >
                    <span className="text-[#1F2A55]">{formData.calendarIntegration}</span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${calendarDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {calendarDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-[#E8F0FF] rounded-lg shadow-lg">
                      {calendarOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, calendarIntegration: option });
                            setCalendarDropdownOpen(false);
                          }}
                          className="w-full px-3 py-1.5 text-sm text-left text-[#1F2A55] font-[BasisGrotesquePro] hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Active Checkbox */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 !rounded-lg !border border-[#3AD6F2] bg-white focus:outline-none cursor-pointer mt-2"
                  />
                  <span className="text-sm text-[#1F2A55] font-[BasisGrotesquePro] ml-3">
                    Active (available for appointments)
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle form submission here
                  console.log('Form Data:', formData);
                  setIsModalOpen(false);
                  // Reset form
                  setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    role: 'Tax Preparer',
                    calendarIntegration: 'Not Connected',
                    active: false
                  });
                }}
                className="px-3 py-1.5 text-sm font-medium text-white !bg-[#F56D2D] !rounded-lg hover:bg-[#FF7142] transition font-[BasisGrotesquePro]"
              >
                Add Staff Member
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Configure Rules Modal */}
      {isConfigureRulesModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={() => setIsConfigureRulesModalOpen(false)}>
          <div className="bg-white rounded-lg p-4 w-full max-w-2xl mx-auto max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro]">
                Staff Assignment Rules
              </h3>
              <button
                onClick={() => setIsConfigureRulesModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                  <path d="M16.067 8.99502C16.1386 8.92587 16.1958 8.84314 16.2352 8.75165C16.2745 8.66017 16.2952 8.56176 16.2962 8.46218C16.2971 8.3626 16.2781 8.26383 16.2405 8.17164C16.2028 8.07945 16.1472 7.99568 16.0768 7.92523C16.0064 7.85478 15.9227 7.79905 15.8305 7.7613C15.7384 7.72354 15.6396 7.70452 15.54 7.70534C15.4404 7.70616 15.342 7.7268 15.2505 7.76606C15.159 7.80532 15.0762 7.86242 15.007 7.93402L12.001 10.939L8.99597 7.93402C8.92731 7.86033 8.84451 7.80123 8.75251 7.76024C8.66051 7.71925 8.5612 7.69721 8.4605 7.69543C8.35979 7.69365 8.25976 7.71218 8.16638 7.7499C8.07299 7.78762 7.98815 7.84376 7.91694 7.91498C7.84572 7.9862 7.78957 8.07103 7.75185 8.16442C7.71413 8.25781 7.69561 8.35784 7.69738 8.45854C7.69916 8.55925 7.7212 8.65856 7.76219 8.75056C7.80319 8.84256 7.86229 8.92536 7.93597 8.99402L10.939 12L7.93397 15.005C7.80149 15.1472 7.72937 15.3352 7.7328 15.5295C7.73623 15.7238 7.81494 15.9092 7.95235 16.0466C8.08977 16.1841 8.27515 16.2628 8.46945 16.2662C8.66375 16.2696 8.8518 16.1975 8.99397 16.065L12.001 13.06L15.006 16.066C15.1481 16.1985 15.3362 16.2706 15.5305 16.2672C15.7248 16.2638 15.9102 16.1851 16.0476 16.0476C16.185 15.9102 16.2637 15.7248 16.2671 15.5305C16.2706 15.3362 16.1985 15.1482 16.066 15.006L13.063 12L16.067 8.99502Z" fill="#3B4A66" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-4">
              {/* Round-Robin Rules */}
              <div>
                <h6 className="text-[16px] font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-3">
                  Round-Robin Rules
                </h6>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configureRulesData.includeAllActiveStaff}
                      onChange={(e) => setConfigureRulesData({ ...configureRulesData, includeAllActiveStaff: e.target.checked })}
                      className="w-4 h-4 !rounded-lg !border-2 !border-[#3AD6F2] bg-white focus:outline-none cursor-pointer"
                    />
                    <span className="text-sm text-[#1F2A55] font-[BasisGrotesquePro] ml-3">
                      Include all active staff in round-robin
                    </span>
                  </label><br/>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configureRulesData.excludeAwayStaff}
                      onChange={(e) => setConfigureRulesData({ ...configureRulesData, excludeAwayStaff: e.target.checked })}
                      className="w-4 h-4 !rounded-lg !border-2 !border-[#3AD6F2] bg-white focus:outline-none cursor-pointer"
                    />
                    <span className="text-sm text-[#1F2A55] font-[BasisGrotesquePro] ml-3">
                      Exclude staff marked as away
                    </span>
                  </label>
                </div>
              </div>

              {/* Distribution Method */}
              <div className="relative dropdown-container">
                <h6 className="text-[16px] font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-2">
                  Distribution Method
                </h6>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setDistributionMethodDropdownOpen(!distributionMethodDropdownOpen);
                      setResetFrequencyDropdownOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-sm border border-[#E8F0FF] !rounded-lg focus:outline-none font-[BasisGrotesquePro] bg-white text-left flex items-center justify-between"
                  >
                    <span className="text-[#1F2A55]">{configureRulesData.distributionMethod}</span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${distributionMethodDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {distributionMethodDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white !border border-[#E8F0FF] !rounded-lg ">
                      {distributionMethodOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setConfigureRulesData({ ...configureRulesData, distributionMethod: option });
                            setDistributionMethodDropdownOpen(false);
                          }}
                          className="w-full px-3 py-1.5 text-sm text-left text-[#1F2A55] font-[BasisGrotesquePro] hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Reset Frequency */}
              <div className="relative dropdown-container">
                <h6 className="text-[16px] font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-2">
                  Reset Frequency
                </h6>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setResetFrequencyDropdownOpen(!resetFrequencyDropdownOpen);
                      setDistributionMethodDropdownOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none font-[BasisGrotesquePro] bg-white text-left flex items-center justify-between"
                  >
                    <span className="text-[#1F2A55]">{configureRulesData.resetFrequency}</span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${resetFrequencyDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {resetFrequencyDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-[#E8F0FF] rounded-lg shadow-lg">
                      {resetFrequencyOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setConfigureRulesData({ ...configureRulesData, resetFrequency: option });
                            setResetFrequencyDropdownOpen(false);
                          }}
                          className="w-full px-3 py-1.5 text-sm text-left text-[#1F2A55] font-[BasisGrotesquePro] hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment Rules by Appointment Type */}
              <div>
                <h6 className="text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-3">
                  Assignment Rules by Appointment Type
                </h6>
                <div className="bg-[#F3F7FF] rounded-lg p-4 space-y-2 border border-[#E8F0FF]">
                  <div className="text-sm font-[BasisGrotesquePro]">
                    <span className="font-semibold text-[#1F2A55]">Tax Preparation:</span> <span className="font-normal text-[#4B5563]">{configureRulesData.appointmentTypeRules.taxPreparation}</span>
                  </div>
                  <div className="text-sm font-[BasisGrotesquePro]">
                    <span className="font-semibold text-[#1F2A55]">Consultation:</span> <span className="font-normal text-[#4B5563]">{configureRulesData.appointmentTypeRules.consultation}</span>
                  </div>
                  <div className="text-sm font-[BasisGrotesquePro]">
                    <span className="font-semibold text-[#1F2A55]">Audit Support:</span> <span className="font-normal text-[#4B5563]">{configureRulesData.appointmentTypeRules.auditSupport}</span>
                  </div>
                  <div className="text-sm font-[BasisGrotesquePro]">
                    <span className="font-semibold text-[#1F2A55]">Training:</span> <span className="font-normal text-[#4B5563]">{configureRulesData.appointmentTypeRules.training}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 mt-4 flex-shrink-0">
              <button
                onClick={() => setIsConfigureRulesModalOpen(false)}
                className="px-3 py-1.5 text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Configure Rules Data:', configureRulesData);
                  setIsConfigureRulesModalOpen(false);
                }}
                className="px-3 py-1.5 text-sm font-medium text-white !bg-[#F56D2D] !rounded-lg hover:bg-[#FF7142] transition font-[BasisGrotesquePro]"
              >
                Save Rules
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Options Modal */}
      {isManageOptionsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={() => setIsManageOptionsModalOpen(false)}>
          <div className="bg-white rounded-lg p-4 w-full max-w-2xl mx-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro]">
                Staff Assignment Rules
              </h3>
              <button
                onClick={() => setIsManageOptionsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                  <path d="M16.067 8.99502C16.1386 8.92587 16.1958 8.84314 16.2352 8.75165C16.2745 8.66017 16.2952 8.56176 16.2962 8.46218C16.2971 8.3626 16.2781 8.26383 16.2405 8.17164C16.2028 8.07945 16.1472 7.99568 16.0768 7.92523C16.0064 7.85478 15.9227 7.79905 15.8305 7.7613C15.7384 7.72354 15.6396 7.70452 15.54 7.70534C15.4404 7.70616 15.342 7.7268 15.2505 7.76606C15.159 7.80532 15.0762 7.86242 15.007 7.93402L12.001 10.939L8.99597 7.93402C8.92731 7.86033 8.84451 7.80123 8.75251 7.76024C8.66051 7.71925 8.5612 7.69721 8.4605 7.69543C8.35979 7.69365 8.25976 7.71218 8.16638 7.7499C8.07299 7.78762 7.98815 7.84376 7.91694 7.91498C7.84572 7.9862 7.78957 8.07103 7.75185 8.16442C7.71413 8.25781 7.69561 8.35784 7.69738 8.45854C7.69916 8.55925 7.7212 8.65856 7.76219 8.75056C7.80319 8.84256 7.86229 8.92536 7.93597 8.99402L10.939 12L7.93397 15.005C7.80149 15.1472 7.72937 15.3352 7.7328 15.5295C7.73623 15.7238 7.81494 15.9092 7.95235 16.0466C8.08977 16.1841 8.27515 16.2628 8.46945 16.2662C8.66375 16.2696 8.8518 16.1975 8.99397 16.065L12.001 13.06L15.006 16.066C15.1481 16.1985 15.3362 16.2706 15.5305 16.2672C15.7248 16.2638 15.9102 16.1851 16.0476 16.0476C16.185 15.9102 16.2637 15.7248 16.2671 15.5305C16.2706 15.3362 16.1985 15.1482 16.066 15.006L13.063 12L16.067 8.99502Z" fill="#3B4A66" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4">
              {/* Client Choice Options */}
              <div>
                <h6 className="text-[16px] font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-3">
                  Client Choice Options
                </h6>
                <div className="flex flex-col space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manageOptionsData.showStaffProfiles}
                      onChange={(e) => setManageOptionsData({ ...manageOptionsData, showStaffProfiles: e.target.checked })}
                      className="w-4 h-4 !rounded-lg !border-2 !border-[#3AD6F2] bg-white focus:outline-none cursor-pointer"
                    />
                    <span className="text-sm text-[#1F2A55] font-[BasisGrotesquePro] ml-3">
                      Show staff profiles and photos during booking
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manageOptionsData.showStaffRatings}
                      onChange={(e) => setManageOptionsData({ ...manageOptionsData, showStaffRatings: e.target.checked })}
                      className="w-4 h-4 !rounded-lg !border-2 !border-[#3AD6F2] bg-white focus:outline-none cursor-pointer"
                    />
                    <span className="text-sm text-[#1F2A55] font-[BasisGrotesquePro] ml-3">
                      Show staff ratings and reviews
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manageOptionsData.allowFilteringByExpertise}
                      onChange={(e) => setManageOptionsData({ ...manageOptionsData, allowFilteringByExpertise: e.target.checked })}
                      className="w-4 h-4 !rounded-lg !border-2 !border-[#3AD6F2] bg-white focus:outline-none cursor-pointer"
                    />
                    <span className="text-sm text-[#1F2A55] font-[BasisGrotesquePro] ml-3">
                      Allow filtering by staff expertise
                    </span>
                  </label>
                </div>
              </div>

              {/* Default Staff Sorting */}
              <div className="relative dropdown-container">
                <h6 className="text-[16px] font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-2">
                  Default Staff Sorting
                </h6>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setDefaultStaffSortingDropdownOpen(!defaultStaffSortingDropdownOpen);
                    }}
                    className="w-full px-3 py-1.5 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none font-[BasisGrotesquePro] bg-white text-left flex items-center justify-between"
                  >
                    <span className="text-[#1F2A55]">{manageOptionsData.defaultStaffSorting}</span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${defaultStaffSortingDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {defaultStaffSortingDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-[#E8F0FF] rounded-lg shadow-lg">
                      {defaultStaffSortingOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setManageOptionsData({ ...manageOptionsData, defaultStaffSorting: option });
                            setDefaultStaffSortingDropdownOpen(false);
                          }}
                          className="w-full px-3 py-1.5 text-sm text-left text-[#1F2A55] font-[BasisGrotesquePro] hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Staff Available for Selection */}
              <div>
                <h6 className="text-[16px] font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-3">
                  Staff Available for Selection
                </h6>
                <div className="flex flex-col space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manageOptionsData.selectedStaff.sarahMiller}
                      onChange={(e) => setManageOptionsData({
                        ...manageOptionsData,
                        selectedStaff: { ...manageOptionsData.selectedStaff, sarahMiller: e.target.checked }
                      })}
                      className="w-4 h-4 !rounded-lg !border-2 !border-[#3AD6F2] bg-white focus:outline-none cursor-pointer"
                    />
                    <span className="text-sm text-[#1F2A55] font-[BasisGrotesquePro] ml-3">
                      Sarah Miller (Senior Tax Preparer)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manageOptionsData.selectedStaff.michaelBrown}
                      onChange={(e) => setManageOptionsData({
                        ...manageOptionsData,
                        selectedStaff: { ...manageOptionsData.selectedStaff, michaelBrown: e.target.checked }
                      })}
                      className="w-4 h-4 !rounded-lg !border-2 !border-[#3AD6F2] bg-white focus:outline-none cursor-pointer"
                    />
                    <span className="text-sm text-[#1F2A55] font-[BasisGrotesquePro] ml-3">
                      Michael Brown (Tax Consultant)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manageOptionsData.selectedStaff.davidWilson}
                      onChange={(e) => setManageOptionsData({
                        ...manageOptionsData,
                        selectedStaff: { ...manageOptionsData.selectedStaff, davidWilson: e.target.checked }
                      })}
                      className="w-4 h-4 !rounded-lg !border-2 !border-[#3AD6F2] bg-white focus:outline-none cursor-pointer"
                    />
                    <span className="text-sm text-[#1F2A55] font-[BasisGrotesquePro] ml-3">
                      David Wilson (Audit Specialist)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manageOptionsData.selectedStaff.emilyJohnson}
                      onChange={(e) => setManageOptionsData({
                        ...manageOptionsData,
                        selectedStaff: { ...manageOptionsData.selectedStaff, emilyJohnson: e.target.checked }
                      })}
                      className="w-4 h-4 !rounded-lg !border-2 !border-[#3AD6F2] bg-white focus:outline-none cursor-pointer"
                    />
                    <span className="text-sm text-[#1F2A55] font-[BasisGrotesquePro] ml-3">
                      Emily Johnson (Training Coordinator)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsManageOptionsModalOpen(false)}
                className="px-3 py-1.5 text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Manage Options Data:', manageOptionsData);
                  setIsManageOptionsModalOpen(false);
                }}
                className="px-3 py-1.5 text-sm font-medium text-white !bg-[#F56D2D] !rounded-lg hover:bg-[#FF7142] transition font-[BasisGrotesquePro]"
              >
                Save Rules
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Up Skills Modal */}
      {isSetUpSkillsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={() => setIsSetUpSkillsModalOpen(false)}>
          <div className="bg-white rounded-lg p-3 w-full max-w-xl mx-auto max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
              <h3 className="text-base sm:text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro]">
                Staff Assignment Rules
              </h3>
              <button
                onClick={() => setIsSetUpSkillsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                  <path d="M16.067 8.99502C16.1386 8.92587 16.1958 8.84314 16.2352 8.75165C16.2745 8.66017 16.2952 8.56176 16.2962 8.46218C16.2971 8.3626 16.2781 8.26383 16.2405 8.17164C16.2028 8.07945 16.1472 7.99568 16.0768 7.92523C16.0064 7.85478 15.9227 7.79905 15.8305 7.7613C15.7384 7.72354 15.6396 7.70452 15.54 7.70534C15.4404 7.70616 15.342 7.7268 15.2505 7.76606C15.159 7.80532 15.0762 7.86242 15.007 7.93402L12.001 10.939L8.99597 7.93402C8.92731 7.86033 8.84451 7.80123 8.75251 7.76024C8.66051 7.71925 8.5612 7.69721 8.4605 7.69543C8.35979 7.69365 8.25976 7.71218 8.16638 7.7499C8.07299 7.78762 7.98815 7.84376 7.91694 7.91498C7.84572 7.9862 7.78957 8.07103 7.75185 8.16442C7.71413 8.25781 7.69561 8.35784 7.69738 8.45854C7.69916 8.55925 7.7212 8.65856 7.76219 8.75056C7.80319 8.84256 7.86229 8.92536 7.93597 8.99402L10.939 12L7.93397 15.005C7.80149 15.1472 7.72937 15.3352 7.7328 15.5295C7.73623 15.7238 7.81494 15.9092 7.95235 16.0466C8.08977 16.1841 8.27515 16.2628 8.46945 16.2662C8.66375 16.2696 8.8518 16.1975 8.99397 16.065L12.001 13.06L15.006 16.066C15.1481 16.1985 15.3362 16.2706 15.5305 16.2672C15.7248 16.2638 15.9102 16.1851 16.0476 16.0476C16.185 15.9102 16.2637 15.7248 16.2671 15.5305C16.2706 15.3362 16.1985 15.1482 16.066 15.006L13.063 12L16.067 8.99502Z" fill="#3B4A66" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-2.5">
              {/* Staff Skills & Expertise */}
              <div>
                <h6 className="text-[16px] font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-2">
                  Staff Skills & Expertise
                </h6>
                <div className="space-y-2">
                  {/* Sarah Miller */}
                  <div className="flex flex-col p-2.5 bg-[#F3F7FF] rounded-lg ">
                    <div className="mb-2">
                      <div className="text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
                        Sarah Miller
                      </div>
                      <div className="text-sm text-[#4B5563] font-[BasisGrotesquePro]">
                        {setUpSkillsData.staffSkills.sarahMiller}
                      </div>
                    </div>
                    <button className="px-3 py-1.5 text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] self-start">
                      Edit Skills
                    </button>
                  </div>

                  {/* Michael Brown */}
                  <div className="flex flex-col p-2.5 bg-[#F3F7FF] rounded-lg">
                    <div className="mb-2">
                      <div className="text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
                        Michael Brown
                      </div>
                      <div className="text-sm text-[#4B5563] font-[BasisGrotesquePro]">
                        {setUpSkillsData.staffSkills.michaelBrown}
                      </div>
                    </div>
                    <button className="px-3 py-1.5 text-sm font-medium text-[#1F2A55] bg-white border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] self-start">
                      Edit Skills
                    </button>
                  </div>

                  {/* David Wilson */}
                  <div className="flex flex-col p-2.5 bg-[#F3F7FF] rounded-lg">
                    <div className="mb-2">
                      <div className="text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
                        David Wilson
                      </div>
                      <div className="text-sm text-[#4B5563] font-[BasisGrotesquePro]">
                        {setUpSkillsData.staffSkills.davidWilson}
                      </div>
                    </div>
                    <button className="px-3 py-1.5 text-sm font-medium text-[#1F2A55] bg-white border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] self-start">
                      Edit Skills
                    </button>
                  </div>

                  {/* Emily Johnson */}
                  <div className="flex flex-col p-2.5 bg-[#F3F7FF] rounded-lg ">
                    <div className="mb-2">
                      <div className="text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
                        Emily Johnson
                      </div>
                      <div className="text-sm text-[#4B5563] font-[BasisGrotesquePro]">
                        {setUpSkillsData.staffSkills.emilyJohnson}
                      </div>
                    </div>
                    <button className="px-3 py-1.5 text-sm font-medium text-[#1F2A55] bg-white border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] self-start">
                      Edit Skills
                    </button>
                  </div>
                </div>
              </div>

              {/* Skill Matching Rules */}
              <div>
                <h6 className="text-[16px] font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-2">
                  Skill Matching Rules
                </h6>
                <div className="space-y-2">
                  {/* Skill Matching Rule Dropdown */}
                  <div className="relative dropdown-container">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setSkillMatchingRulesDropdownOpen(!skillMatchingRulesDropdownOpen);
                        }}
                        className="w-full px-3 py-1.5 text-sm !border border-[#E8F0FF] !rounded-lg focus:outline-none font-[BasisGrotesquePro]  text-left flex items-center justify-between"
                      >
                        <span className="text-[#1F2A55]">{setUpSkillsData.skillMatchingRule}</span>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${skillMatchingRulesDropdownOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {skillMatchingRulesDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-[#E8F0FF] !rounded-lg">
                          {skillMatchingRulesOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setSetUpSkillsData({ ...setUpSkillsData, skillMatchingRule: option });
                                setSkillMatchingRulesDropdownOpen(false);
                              }}
                              className="w-full px-3 py-1.5 text-sm text-left text-[#1F2A55] font-[BasisGrotesquePro] hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="flex flex-col space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setUpSkillsData.requireExactMatch}
                        onChange={(e) => setSetUpSkillsData({ ...setUpSkillsData, requireExactMatch: e.target.checked })}
                        className="w-4 h-4 !rounded-lg !border-2 !border-[#3AD6F2] bg-white focus:outline-none cursor-pointer"
                      />
                      <span className="text-sm text-[#1F2A55] font-[BasisGrotesquePro] ml-3">
                        Require exact match
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setUpSkillsData.autoUpdateSkills}
                        onChange={(e) => setSetUpSkillsData({ ...setUpSkillsData, autoUpdateSkills: e.target.checked })}
                        className="w-4 h-4 !rounded-lg !border-2 !border-[#3AD6F2] bg-white focus:outline-none cursor-pointer"
                      />
                      <span className="text-sm text-[#1F2A55] font-[BasisGrotesquePro] ml-3">
                        Automatically update staff skills based on completed appointments
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 mt-3 flex-shrink-0">
              <button
                onClick={() => setIsSetUpSkillsModalOpen(false)}
                className="px-3 py-1.5 text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Set Up Skills Data:', setUpSkillsData);
                  setIsSetUpSkillsModalOpen(false);
                }}
                className="px-3 py-1.5 text-sm font-medium text-white !bg-[#F56D2D] !rounded-lg hover:bg-[#FF7142] transition font-[BasisGrotesquePro]"
              >
                Save Rules
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

