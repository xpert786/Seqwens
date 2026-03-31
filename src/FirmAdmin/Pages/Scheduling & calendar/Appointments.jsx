import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { firmAdminCalendarAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';
import {
    CalendarIcon,
    TimeIcon as ClockIcon,
    UsersIcon,
    VideoIcon,
    PlusIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CloseModalIcon as CloseIcon,
    CalendarInputIcon as CalendarAltIcon,
    ClockInputIcon as ClockAltIcon,
    ChevronDownIcon
} from '../../FirmAdminIcons/Icons';

/**
 * The Appointments page uses the same calendar experience as the main
 * Scheduling calendar. Reusing the component ensures feature parity
 * (data fetching, highlighting, modals, etc.) across both routes.
 */
const Appointments = () => {
    const location = useLocation();
    const activeTab = location.pathname.includes('/appointments') ? 'Appointments' :

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
    const navTabs = ['Calendar', 'Appointments', 'Staff'];
    const tabPaths = {
        Calendar: '/firmadmin/calendar',
        Appointments: '/firmadmin/calendar/appointments',

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
                <CalendarIcon color="#3AD6F2" />
            ),
            value: statistics.scheduled_month.toString(),
            label: 'Scheduled (month)'
        },
        {
            icon: (
                <ClockIcon color="#3AD6F2" />
            ),
            value: statistics.completed.toString(),
            label: 'Completed'
        },
        {
            icon: (
                <UsersIcon color="#3AD6F2" />
            ),
            value: `${statistics.no_show_rate}%`,
            label: 'No-show rate'
        },
        {
            icon: (
                <VideoIcon color="#3AD6F2" />
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
                                Firm Calendar
                            </h4>
                            <p className="text-gray-600 font-[BasisGrotesquePro]">
                                Manage appointments, deadlines, and meetings
                            </p>
                        </div>

                        <button
                            onClick={() => setIsAddEventModalOpen(true)}
                            className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors flex items-center gap-2 font-[BasisGrotesquePro] mt-4 lg:mt-0"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add Event
                        </button>

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
                                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-[BasisGrotesquePro] transition-colors !rounded-lg ${viewMode === tab
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
                                        <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <button
                                        onClick={goToToday}
                                        className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-white !border border-[#E8F0FF] rounded-lg font-[BasisGrotesquePro] transition-colors text-gray-600"
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
                                        <ChevronRightIcon className="w-4 h-4 text-gray-600" />
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
                                                className={`min-h-[160px] p-2 sm:p-3 border-r border-b border-[#E8F0FF] relative ${!day.isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                                                    } ${day.isToday ? 'bg-blue-50' : ''} ${(index + 1) % 7 === 0 ? 'border-r-0' : ''}`}
                                            >
                                                {!(day.date === 21 && day.isCurrentMonth) && (
                                                    <div className={`text-xs sm:text-sm font-[BasisGrotesquePro] mb-1 text-right ${!day.isCurrentMonth ? 'text-gray-400' : day.isToday ? 'text-blue-600 font-bold' : 'text-gray-900'
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
                                                            <div className="bg-[#FFF5E0] border border-[#FFE0B2] text-[#F56D2D] rounded-lg px-2 py-1.5 flex flex-col gap-0.5 shadow-sm">
                                                                <span className="text-[11px] font-medium leading-tight break-words line-clamp-2">
                                                                    Schedule a free Phone Consultation
                                                                </span>
                                                                <div className="flex items-center gap-1 opacity-100">
                                                                    <div className="w-1 h-1 bg-[#F56D2D] rounded-full flex-shrink-0"></div>
                                                                    <span className="text-[10px] whitespace-nowrap font-medium">
                                                                        09:00 - 10:00
                                                                    </span>
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
                                            className={`rounded-lg border border-[#E8F0FF] p-3 text-center font-[BasisGrotesquePro] text-sm ${month.index === currentDate.getMonth() ? 'bg-blue-50 border-blue-300 text-blue-600 font-semibold' : 'bg-white text-gray-700'
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
                    <div className="w-full lg:w-64 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-col gap-4">
                        {/* Today's Events */}
                        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4">
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

            </div>

            {/* Add Calendar Event Modal */}
            {isAddEventModalOpen && createPortal(
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100002] p-4">
                    <div className="bg-white rounded-lg !border border-[#E8F0FF] w-full max-w-xl max-h-[85vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between p-3 border-b border-[#E8F0FF] flex-shrink-0">
                            <div>
                                <h5 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro] mb-0.5">Add Calendar Event</h5>
                                <p className="mb-0 text-sm text-gray-600 font-[BasisGrotesquePro]">Schedule a new meeting, appointment, or deadline</p>
                            </div>
                            <button
                                onClick={() => setIsAddEventModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <CloseIcon />
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
                                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
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
                                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[16px] font-medium text-gray-900 mb-0.5 font-[BasisGrotesquePro]">Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={eventDate}
                                            onChange={(e) => setEventDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-3 py-1.5 text-sm !border border-[#E8F0FF] rounded-lg focus:outline-none font-[BasisGrotesquePro] bg-white"
                                        />
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
                                            <ClockAltIcon className="w-4 h-4 text-gray-400" />
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
                                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
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
                                style={{ borderRadius: '10px' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setIsAddEventModalOpen(false);
                                }}
                                className="px-4 py-1.5 text-sm bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro]"
                                style={{ borderRadius: '10px' }}
                            >
                                Add Event
                            </button>
                        </div>
                    </div>
                </div>, document.body
            )}
        </div>
    );
};

export default Appointments;

