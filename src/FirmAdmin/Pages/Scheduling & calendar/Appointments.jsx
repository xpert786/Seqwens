import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Appointments = () => {
    const location = useLocation();
    const activeTab = location.pathname.includes('/appointments') ? 'Appointments' : 
                     location.pathname.includes('/features') ? 'Features' :
                     location.pathname.includes('/staff') ? 'Staff' : 'Calendar';
    
    // Calendar states
    const [viewMode, setViewMode] = useState('Monthly');
    const [currentDate, setCurrentDate] = useState(new Date(2025, 6, 1)); // July 2025
    
    // Add Event Modal State
    const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
    const [eventTitle, setEventTitle] = useState('');
    const [eventType, setEventType] = useState('');
    const [client, setClient] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [duration, setDuration] = useState('60');
    const [assignStaff, setAssignStaff] = useState('');
    const [eventLocation, setEventLocation] = useState('Conference Room A or Virtual');
    const [description, setDescription] = useState('');

    // Navigation tabs
    const navTabs = ['Calendar', 'Appointments', 'Features', 'Staff'];

    // View mode tabs
    const viewTabs = ['Day', 'Week', 'Monthly', 'Years', 'Agenda'];

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

    return (
        <div className="min-h-screen bg-[#F6F7FF] p-6">
            <div className="mx-auto">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-6">
                        <div>
                            <h4 className="text-2xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Firm Calendar</h4>
                            <p className="text-gray-600 font-[BasisGrotesquePro]">Manage appointments, deadlines, and meetings</p>
                        </div>
                        <button
                            onClick={() => setIsAddEventModalOpen(true)}
                            className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors flex items-center gap-2 font-[BasisGrotesquePro] mt-4 lg:mt-0"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Event
                        </button>
                    </div>

                    {/* Navigation Tabs and Event Filters */}
                    <div className="flex flex-col lg:flex-row justify-between mb-6 items-start">
                        {/* Navigation Tabs - Left Side */}
                        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-2">
                            <div className="flex gap-2">
                                {navTabs.map((tab) => {
                                    const isNavigable = tab === 'Calendar' || tab === 'Appointments';
                                    const tabPath = tab === 'Calendar' ? '/firmadmin/calendar' : `/firmadmin/calendar/${tab.toLowerCase()}`;
                                    
                                    if (isNavigable) {
                                        return (
                                            <Link
                                                key={tab}
                                                to={tabPath}
                                                className={`px-4 py-2 font-[BasisGrotesquePro] transition-colors !rounded-lg ${
                                                    activeTab === tab
                                                        ? 'bg-[#3AD6F2] !text-white font-semibold'
                                                        : 'bg-transparent hover:bg-gray-50 !text-black'
                                                }`}
                                            >
                                                {tab}
                                            </Link>
                                        );
                                    } else {
                                        return (
                                            <button
                                                key={tab}
                                                type="button"
                                                className={`px-4 py-2 font-[BasisGrotesquePro] transition-colors !rounded-lg cursor-pointer ${
                                                    activeTab === tab
                                                        ? 'bg-[#3AD6F2] !text-white font-semibold'
                                                        : 'bg-transparent hover:bg-gray-50 !text-black'
                                                }`}
                                            >
                                                {tab}
                                            </button>
                                        );
                                    }
                                })}
                            </div>
                        </div>

                        {/* Event Filters - Right Side */}
                        <div className="flex flex-col sm:flex-row gap-2 mt-2 lg:mt-0">
                            <div className="w-full sm:w-auto">
                                <input
                                    type="text"
                                    placeholder="Event ID"
                                    className="w-full sm:w-[150px] px-3 py-2 !border border-[#E8F0FF] !rounded-lg focus:outline-none font-[BasisGrotesquePro] bg-white !text-[#4B5563]"
                                />
                            </div>
                            <div className="w-full sm:w-auto">
                                <div className="relative">
                                    <select className="w-full sm:w-[150px] appearance-none bg-white !border border-[#E8F0FF] !rounded-lg px-3 py-2 pr-10 text-gray-700 focus:outline-none font-[BasisGrotesquePro] cursor-pointer">
                                        <option>Firm Calendar</option>
                                        <option>Personal Calendar</option>
                                        <option>Team Calendar</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

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
                                <div>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                        {yearMonths.map((month, index) => (
                                            <div key={index} className="p-4 border border-[#E8F0FF] rounded-lg hover:bg-gray-50 cursor-pointer">
                                                <h6 className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro] mb-2">{month.name}</h6>
                                                <div className="text-xs text-gray-500 font-[BasisGrotesquePro]">{month.year}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {viewMode === 'Agenda' && (
                                <div className="space-y-4">
                                    <div className="border-b border-[#E8F0FF] pb-2 mb-4">
                                        <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro]">{currentMonthName} {currentYear}</h5>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 p-3 border border-[#E8F0FF] rounded-lg">
                                            <div className="w-16 text-sm text-gray-600 font-[BasisGrotesquePro]">Jul 21</div>
                                            <div className="flex-1">
                                                <div className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">Schedule a free Phone...</div>
                                                <div className="text-xs text-gray-500 font-[BasisGrotesquePro]" style={{ color: '#00C0C6' }}>06:00 - 08:00</div>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500 font-[BasisGrotesquePro] text-center py-4">No more events this month</div>
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
            </div>

            {/* Add Calendar Event Modal */}
            {isAddEventModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg !border border-[#E8F0FF] w-full max-w-xl max-h-[75vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between p-3 border-b border-[#E8F0FF] flex-shrink-0">
                            <div>
                                <h5 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro] mb-0.5">Add Calendar Event</h5>
                                <p className="text-xs text-gray-600 font-[BasisGrotesquePro]">Schedule a new meeting, appointment, or deadline</p>
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
                                <label className="block text-xs font-medium text-gray-900 mb-0.5 font-[BasisGrotesquePro]">Event Title</label>
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
                                <label className="block text-xs font-medium text-gray-900 mb-0.5 font-[BasisGrotesquePro]">Event type</label>
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
                                <label className="block text-xs font-medium text-gray-900 mb-0.5 font-[BasisGrotesquePro]">Client (optional)</label>
                                <div className="relative">
                                    <select
                                        value={client}
                                        onChange={(e) => setClient(e.target.value)}
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
                                    <label className="block text-xs font-medium text-gray-900 mb-0.5 font-[BasisGrotesquePro]">Date</label>
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
                                    <label className="block text-xs font-medium text-gray-900 mb-0.5 font-[BasisGrotesquePro]">Time</label>
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
                                <label className="block text-xs font-medium text-gray-900 mb-0.5 font-[BasisGrotesquePro]">Duration(minutes)</label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    className="w-full px-3 py-1.5 text-sm !border border-[#E8F0FF] rounded-lg focus:outline-none font-[BasisGrotesquePro] bg-white"
                                />
                            </div>

                            {/* Assign Staff */}
                            <div>
                                <label className="block text-xs font-medium text-gray-900 mb-0.5 font-[BasisGrotesquePro]">Assign Staff</label>
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
                                <label className="block text-xs font-medium text-gray-900 mb-0.5 font-[BasisGrotesquePro]">Location</label>
                                <input
                                    type="text"
                                    value={eventLocation}
                                    onChange={(e) => setEventLocation(e.target.value)}
                                    className="w-full px-3 py-1.5 text-sm !border border-[#E8F0FF] rounded-lg focus:outline-none font-[BasisGrotesquePro] bg-white"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-medium text-gray-900 mb-0.5 font-[BasisGrotesquePro]">Description</label>
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
