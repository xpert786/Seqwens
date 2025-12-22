import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Feature from './Feature';
import { firmAdminCalendarAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

/**
 * The Appointments page uses the same calendar experience as the main
 * Scheduling calendar. Reusing the component ensures feature parity
 * (data fetching, highlighting, modals, etc.) across both routes.
 */
const Appointments = () => {
    const location = useLocation();
    const activeTab = location.pathname.includes('/appointments') ? 'Appointments' :
        location.pathname.includes('/features') ? 'Features' :
            location.pathname.includes('/staff') ? 'Staff' : 'Calendar';
    const navigate = useNavigate();
    const [selectedTab, setSelectedTab] = useState(activeTab);

    useEffect(() => {
        setSelectedTab(activeTab);
    }, [activeTab]);
    
    // Calendar states
    const [viewMode, setViewMode] = useState('Monthly');
    const [currentDate, setCurrentDate] = useState(new Date(2025, 6, 1)); // July 2025
    const [statistics, setStatistics] = useState({
        scheduled_month: 0,
        completed: 0,
        no_show_rate: 0,
        avg_duration_display: '0m'
    });
    const [loadingStats, setLoadingStats] = useState(false);

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
    
    // Add Event Modal State
    const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
    const [eventTitle, setEventTitle] = useState('Consultation Call');
    const [eventType, setEventType] = useState('Consultation');
    const [eventClient, setEventClient] = useState('client1');
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [duration, setDuration] = useState('60');
    const [assignStaff, setAssignStaff] = useState('');
    const [eventLocation, setEventLocation] = useState('Conference Room A or Virtual');
    const [description, setDescription] = useState('');

    // Navigation tabs
    const navTabs = ['Calendar', 'Appointments', 'Features', 'Staff'];
    const tabPaths = {
        Calendar: '/firmadmin/calendar',
        Appointments: '/firmadmin/calendar/appointments',
        Features: '/firmadmin/calendar/features',
        Staff: '/firmadmin/calendar/staff',
    };

    // View mode tabs
    const viewTabs = ['Day', 'Week', 'Monthly', 'Years', 'Agenda'];

    const featureCards = [
        {
            title: 'Calendar Integration',
            description: 'Sync with external calendars and manage firm vs staff calendars.',
            icon: '🗓',
            primary: true,
        },
        {
            title: 'Appointment Types',
            description: 'Create custom appointment types with time buffers and locations.',
            icon: '🗂',
        },
        {
            title: 'Staff Assignment',
            description: 'Set up auto-assignment rules and round-robin scheduling.',
            icon: '👥',
        },
        {
            title: 'Client Self-Scheduling',
            description: 'Configure booking links, website embed, and intake forms.',
            icon: '🧾',
        },
        {
            title: 'Notifications & Reminders',
            description: 'Set up automated reminders and custom notification sequences.',
            icon: '🔔',
        },
        {
            title: 'Compliance & Security',
            description: 'Configure audit trails and e-signature requirements.',
            icon: '🔐',
        },
    ];

    const featureSettings = [
        { name: 'Google Calendar Sync', status: 'Active', statusClasses: 'bg-[#22C55E] text-white', updated: 'Nov 1, 2023' },
        { name: 'Outlook Calendar Sync', status: 'Pending', statusClasses: 'bg-[#FACC15] text-[#854D0E]', updated: 'Oct 28, 2023' },
        { name: 'Two-Way Sync', status: 'Active', statusClasses: 'bg-[#22C55E] text-white', updated: 'Nov 2, 2023' },
        { name: 'SMS Reminders', status: 'Active', statusClasses: 'bg-[#22C55E] text-white', updated: 'Oct 15, 2023' },
    ];

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Get days in month
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Previous month's days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            days.push({
                date: prevMonthLastDay - i,
                isCurrentMonth: false,
                isToday: false
            });
        }

        // Current month's days
        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: i,
                isCurrentMonth: true,
                isToday: today.getDate() === i && today.getMonth() === month && today.getFullYear() === year
            });
        }

        // Next month's days to fill the grid
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: i,
                isCurrentMonth: false,
                isToday: false
            });
        }

        return days;
    };

    const navigateMonth = (direction) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    };

    const navigateDay = (direction) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + direction));
    };

    const navigateWeek = (direction) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + (direction * 7)));
    };

    const navigateYear = (direction) => {
        setCurrentDate(new Date(currentDate.getFullYear() + direction, currentDate.getMonth(), 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Get week days
    const getWeekDays = (date) => {
        const startOfWeek = new Date(date);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day;
        const weekStart = new Date(startOfWeek.setDate(diff));

        const days = [];
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(weekStart);
            currentDay.setDate(weekStart.getDate() + i);
            const today = new Date();
            days.push({
                date: currentDay.getDate(),
                month: currentDay.getMonth(),
                year: currentDay.getFullYear(),
                isToday: currentDay.getDate() === today.getDate() &&
                    currentDay.getMonth() === today.getMonth() &&
                    currentDay.getFullYear() === today.getFullYear(),
                dayName: dayNames[currentDay.getDay()]
            });
        }
        return days;
    };

    // Get year months
    const getYearMonths = (year) => {
        return monthNames.map((month, index) => ({
            name: month,
            index: index,
            year: year
        }));
    };

    const calendarDays = getDaysInMonth(currentDate);
    const weekDays = getWeekDays(currentDate);
    const yearMonths = getYearMonths(currentDate.getFullYear());
    const currentMonthName = monthNames[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear();
    const currentDay = currentDate.getDate();

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
        <div className="min-h-screen bg-[#F6F7FF] p-6">
            <div className="mx-auto">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-6">
                        <div>
                            <h4 className="text-2xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">
                                {selectedTab === 'Features' ? 'Features' : 'Firm Calendar'}
                            </h4>
                            <p className="text-gray-600 font-[BasisGrotesquePro]">
                                Manage appointments, deadlines, and meetings
                            </p>
                        </div>
                        {selectedTab !== 'Features' && (
                            <button
                                onClick={() => setIsAddEventModalOpen(true)}
                                className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors flex items-center gap-2 font-[BasisGrotesquePro] mt-4 lg:mt-0"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Event
                            </button>
                        )}
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

                    {/* Navigation Tabs and Event Filters */}
                    <div className="flex flex-col lg:flex-row justify-between mb-6 items-start">
                        {/* Navigation Tabs - Left Side */}
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
                                            className={`px-4 py-2 font-[BasisGrotesquePro] transition-colors !rounded-lg cursor-pointer ${
                                                isActive
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

                {selectedTab === 'Features' ? (
                    <Feature />
                ) : (
                    <>
                        {/* Event Filters - Right Side */}
                        

                        {/* Main Content Area */}
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Calendar Section */}
                            <div className="flex-1">
                                {/* View Controls */}
                                <div className="flex gap-2 mb-4 flex-wrap">
                                    {viewTabs.map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setViewMode(tab)}
                                            className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-[BasisGrotesquePro] transition-colors !rounded-lg ${
                                                viewMode === tab
                                                    ? 'bg-[#F56D2D] text-white'
                                                    : 'bg-white !border border-[#E8F0FF] text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                {/* Dynamic Navigation */}
                                <div className="sm:p-4 mb-4">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <h5 className="text-lg sm:text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                                            {viewMode === 'Day' && `${dayNames[currentDate.getDay()]}, ${currentMonthName} ${currentDay}, ${currentYear}`}
                                            {viewMode === 'Week' && `Week of ${currentMonthName} ${weekDays[0].date}, ${currentYear}`}
                                            {viewMode === 'Monthly' && `${currentMonthName} ${currentYear}`}
                                            {viewMode === 'Years' && `${currentYear}`}
                                            {viewMode === 'Agenda' && `Agenda - ${currentMonthName} ${currentYear}`}
                                        </h5>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    if (viewMode === 'Day') navigateDay(-1);
                                                    else if (viewMode === 'Week') navigateWeek(-1);
                                                    else if (viewMode === 'Years') navigateYear(-1);
                                                    else navigateMonth(-1);
                                                }}
                                                className="px-2 sm:px-3 py-2 bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={goToToday}
                                                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-white !border border-[#E8F0FF] rounded-lg hover:bg-gray-50 font-[BasisGrotesquePro] transition-colors text-gray-600"
                                            >
                                                Today
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (viewMode === 'Day') navigateDay(1);
                                                    else if (viewMode === 'Week') navigateWeek(1);
                                                    else if (viewMode === 'Years') navigateYear(1);
                                                    else navigateMonth(1);
                                                }}
                                                className="px-2 sm:px-3 py-2 bg-white !border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Calendar Views */}
                                <div className="bg-white rounded-lg !border border-[#E8F0FF] p-2 sm:p-4 lg:p-6 overflow-x-auto">
                                    {viewMode === 'Day' && (
                                        <div className="min-h-[400px]">
                                            <div className="text-center mb-4">
                                                <h5 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">{currentDay}</h5>
                                                <p className="text-gray-600 font-[BasisGrotesquePro]">{dayNames[currentDate.getDay()]}, {currentMonthName} {currentYear}</p>
                                            </div>
                                            <div className="space-y-2">
                                                {Array.from({ length: 24 }, (_, i) => (
                                                    <div key={i} className="flex items-center border-b border-[#E8F0FF] py-2">
                                                        <div className="w-20 text-sm text-gray-600 font-[BasisGrotesquePro]">{String(i).padStart(2, '0')}:00</div>
                                                        <div className="flex-1">
                                                            {i === 6 && currentDay === 21 && currentDate.getMonth() === 6 && currentDate.getFullYear() === 2025 && (
                                                                <div className="bg-[#FFF5E0] border border-[#FFE0B2] rounded-lg px-2 py-1.5 flex items-start gap-2">
                                                                    <div className="w-2 h-2 bg-[#F56D2D] rounded-full mt-1.5 flex-shrink-0"></div>
                                                                    <div>
                                                                        <div className="text-xs text-gray-900 font-[BasisGrotesquePro]">Schedule a free Phone...</div>
                                                                        <div className="text-xs font-[BasisGrotesquePro]" style={{ color: '#00C0C6' }}>06:00 - 08:00</div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {viewMode === 'Week' && (
                                        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 min-w-[600px]">
                                            {dayNames.map((day) => (
                                                <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-700 py-1 sm:py-2 font-[BasisGrotesquePro] border-b border-[#E8F0FF]">
                                                    {day}
                                                </div>
                                            ))}
                                            {weekDays.map((day, index) => (
                                                <div key={index} className={`min-h-[300px] p-2 border border-[#E8F0FF] rounded-lg ${day.isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}>
                                                    <div className={`text-sm font-[BasisGrotesquePro] mb-2 text-right ${day.isToday ? 'text-blue-600 font-bold' : 'text-gray-900'}`}>
                                                        {day.date}
                                                    </div>
                                                    {day.date === 21 && day.month === currentDate.getMonth() && (
                                                        <div className="bg-[#FFF5E0] border border-[#FFE0B2] rounded-lg px-2 py-1.5 flex items-start gap-2">
                                                            <div className="w-2 h-2 bg-[#F56D2D] rounded-full mt-1.5 flex-shrink-0"></div>
                                                            <div>
                                                                <div className="text-xs text-gray-900 font-[BasisGrotesquePro]">Schedule a free Phone...</div>
                                                                <div className="text-xs font-[BasisGrotesquePro]" style={{ color: '#00C0C6' }}>06:00 - 08:00</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {viewMode === 'Monthly' && (
                                        <div className="border border-[#E8F0FF] rounded-lg overflow-hidden min-w-[600px]">
                                            <div className="grid grid-cols-7">
                                                {dayNames.map((day) => (
                                                    <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-700 py-1 sm:py-2 font-[BasisGrotesquePro] border-b border-[#E8F0FF] border-r border-[#E8F0FF] last:border-r-0 bg-white">
                                                        {day}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-7">
                                                {calendarDays.map((day, index) => (
                                                    <div
                                                        key={index}
                                                        className={`min-h-[60px] sm:min-h-[70px] lg:min-h-[80px] p-1 sm:p-2 border-r border-b border-[#E8F0FF] relative ${
                                                            !day.isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                                                        } ${day.isToday ? 'bg-blue-50' : ''} ${(index + 1) % 7 === 0 ? 'border-r-0' : ''}`}
                                                    >
                                                    {!(day.date === 21 && day.isCurrentMonth) && (
                                                        <div className={`text-xs sm:text-sm font-[BasisGrotesquePro] mb-1 text-right ${
                                                            !day.isCurrentMonth ? 'text-gray-400' : day.isToday ? 'text-blue-600 font-bold' : 'text-gray-900'
                                                        }`}>
                                                            {day.date}
                                                        </div>
                                                    )}
                                                    {day.date === 21 && day.isCurrentMonth && (
                                                        <>
                                                            <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                                <span className="text-white text-xs font-bold font-[BasisGrotesquePro]">{day.date}</span>
                                                            </div>
                                                            <div className="mt-6 sm:mt-8">
                                                                <div className="bg-[#FFF5E0] border border-[#FFE0B2] rounded-lg px-2 py-1.5 flex items-start gap-2 break-words">
                                                                    <div className="w-2 h-2 bg-[#F56D2D] rounded-full mt-1.5 flex-shrink-0"></div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-[10px] sm:text-xs text-gray-900 font-[BasisGrotesquePro] leading-tight break-words">Schedule a free Phone...</div>
                                                                        <div className="text-[10px] sm:text-xs font-[BasisGrotesquePro] leading-tight" style={{ color: '#00C0C6' }}>09:00 - 10:00</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {viewMode === 'Years' && (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 min-w-[400px]">
                                            {yearMonths.map((month) => (
                                                <div
                                                    key={`${month.name}-${month.year}`}
                                                    className={`rounded-lg border border-[#E8F0FF] p-3 text-center font-[BasisGrotesquePro] text-sm ${
                                                        month.index === currentDate.getMonth() ? 'bg-blue-50 border-blue-300 text-blue-600 font-semibold' : 'bg-white text-gray-700'
                                                    }`}
                                                >
                                                    {month.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {viewMode === 'Agenda' && (
                                        <div className="space-y-3">
                                            <div className="border border-[#E8F0FF] rounded-lg p-4">
                                                <h6 className="text-sm font-semibold text-[#1E293B] font-[BasisGrotesquePro] mb-2">July 21, 2025</h6>
                                                <div className="bg-[#FFF5E0] border border-[#FFE0B2] rounded-lg px-3 py-2 flex items-start gap-2">
                                                    <div className="w-2 h-2 bg-[#F56D2D] rounded-full mt-1.5 flex-shrink-0"></div>
                                                    <div>
                                                        <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">Schedule a free Phone Consultation</div>
                                                        <div className="text-xs font-[BasisGrotesquePro]" style={{ color: '#00C0C6' }}>09:00 - 10:00 · Virtual</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="border border-[#E8F0FF] rounded-lg p-4">
                                                <h6 className="text-sm font-semibold text-[#1E293B] font-[BasisGrotesquePro] mb-2">July 22, 2025</h6>
                                                <p className="text-xs text-gray-600 font-[BasisGrotesquePro]">No events scheduled</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Sidebar */}
                    <div className="w-full lg:w-80 space-y-4">
                        {/* Today's Events */}
                        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 mt-17">
                            <h6 className="text-lg font-semibold text-gray-900 mb-1 font-[BasisGrotesquePro]">Today's Events</h6>
                            <p className="text-sm text-gray-500 mb-4 font-[BasisGrotesquePro]">7/28/2025</p>
                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] text-center">No events scheduled for today</p>
                        </div>

                        {/* Upcoming Events */}
                        <div className="bg-white rounded-lg !border border-[#E8F0FF] p-4">
                            <h6 className="text-lg font-semibold text-gray-900 mb-1 font-[BasisGrotesquePro]">Upcoming Events</h6>
                            <p className="text-sm text-gray-500 mb-4 font-[BasisGrotesquePro]">Next 7 Days</p>
                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] text-center">No upcoming events</p>
                        </div>
                    </div>
                        </div>
                    </>
                )}
            </div>

            {/* Add Calendar Event Modal */}
            {isAddEventModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg !border border-[#E8F0FF] w-full max-w-xl max-h-[75vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between p-3 border-b border-[#E8F0FF] flex-shrink-0">
                            <div>
                                <h5 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro] mb-0.5">Add Calendar Event</h5>
                                <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Schedule a new meeting, appointment, or deadline</p>
                            </div>
                            <button
                                onClick={() => setIsAddEventModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                                    <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="p-3 space-y-3 overflow-y-auto hide-scrollbar flex-1">
                            {/* Event Title */}
                            <div>
                                <label className="block text-[16px] font-medium text-gray-900 mb-0.5 font-[BasisGrotesquePro]">Event Title</label>
                                <input
                                    type="text"
                                    value={eventTitle}
                                    onChange={(e) => setEventTitle(e.target.value)}
                                    placeholder="Enter event title"
                                    className="w-full px-3 py-1.5 text-sm !border border-[#E8F0FF] rounded-lg focus:outline-none font-[BasisGrotesquePro] bg-white"
                                />
                            </div>

                            {/* Event Type */}
                            <div>
                                <label className="block text-[16px] font-medium text-gray-900 mb-0.5 font-[BasisGrotesquePro]">Event type</label>
                                <div className="relative">
                                    <select
                                        value={eventType}
                                        onChange={(e) => setEventType(e.target.value)}
                                        className="w-full appearance-none bg-white !border border-[#E8F0FF] rounded-lg px-3 py-1.5 pr-10 text-sm text-gray-700 focus:outline-none font-[BasisGrotesquePro] cursor-pointer"
                                    >
                                        <option value="">Select type</option>
                                        <option value="meeting">Meeting</option>
                                        <option value="appointment">Appointment</option>
                                        <option value="deadline">Deadline</option>
                                        <option value="reminder">Reminder</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Client (optional) */}
                            <div>
                                <label className="block text-[16px] font-medium text-gray-900 mb-0.5 font-[BasisGrotesquePro]">Client (optional)</label>
                                <div className="relative">
                                    <select
                                        value={eventClient}
                                        onChange={(e) => setEventClient(e.target.value)}
                                        className="w-full appearance-none bg-white !border border-[#E8F0FF] rounded-lg px-3 py-1.5 pr-10 text-sm text-gray-700 focus:outline-none font-[BasisGrotesquePro] cursor-pointer"
                                    >
                                        <option value="">Select client</option>
                                        <option value="client1">Client 1</option>
                                        <option value="client2">Client 2</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[16px] font-medium text-gray-900 mb-0.5 font-[BasisGrotesquePro]">Date</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={eventDate}
                                            onChange={(e) => setEventDate(e.target.value)}
                                            placeholder="mm/dd/yyyy"
                                            className="w-full px-3 py-1.5 text-sm !border border-[#E8F0FF] rounded-lg focus:outline-none font-[BasisGrotesquePro] bg-white pr-10"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[16px] font-medium text-gray-900 mb-0.5 font-[BasisGrotesquePro]">Time</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={eventTime}
                                            onChange={(e) => setEventTime(e.target.value)}
                                            placeholder="--:--"
                                            className="w-full px-3 py-1.5 text-sm !border border-[#E8F0FF] rounded-lg focus:outline-none font-[BasisGrotesquePro] bg-white pr-10"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-[16px] font-medium text-gray-900 mb-0.5 font-[BasisGrotesquePro]">Duration(minutes)</label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    className="w-full px-3 py-1.5 text-sm !border border-[#E8F0FF] rounded-lg focus:outline-none font-[BasisGrotesquePro] bg-white"
                                />
                            </div>

                            {/* Assign Staff */}
                            <div>
                                <label className="block text-[16px] text-xs font-medium text-gray-900 mb-0.5 font-[BasisGrotesquePro]">Assign Staff</label>
                                <div className="relative">
                                    <select
                                        value={assignStaff}
                                        onChange={(e) => setAssignStaff(e.target.value)}
                                        className="w-full appearance-none bg-white !border border-[#E8F0FF] rounded-lg px-3 py-1.5 pr-10 text-sm text-gray-700 focus:outline-none font-[BasisGrotesquePro] cursor-pointer"
                                    >
                                        <option value="">Select staff members</option>
                                        <option value="staff1">Staff Member 1</option>
                                        <option value="staff2">Staff Member 2</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-[16px] font-medium text-gray-900 mb-0.5 font-[BasisGrotesquePro]">Location</label>
                                <input
                                    type="text"
                                    value={eventLocation}
                                    onChange={(e) => setEventLocation(e.target.value)}
                                    className="w-full px-3 py-1.5 text-sm !border border-[#E8F0FF] rounded-lg focus:outline-none font-[BasisGrotesquePro] bg-white"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-[16px] font-medium text-gray-900 mb-0.5 font-[BasisGrotesquePro]">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Event details..."
                                    rows={3}
                                    className="w-full px-3 py-1.5 text-sm !border border-[#E8F0FF] rounded-lg focus:outline-none font-[BasisGrotesquePro] bg-white resize-none"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-2 p-3 border-t border-[#E8F0FF] flex-shrink-0">
                            <button
                                onClick={() => setIsAddEventModalOpen(false)}
                                className="px-4 py-1.5 text-sm bg-white !border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setIsAddEventModalOpen(false);
                                }}
                                className="px-4 py-1.5 text-sm bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro]"
                            >
                                Add Event
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Appointments;

