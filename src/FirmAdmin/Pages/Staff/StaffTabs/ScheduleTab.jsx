import React, { useState } from 'react';

export default function ScheduleTab() {
  const [currentView, setCurrentView] = useState('Week');
  const [currentDate, setCurrentDate] = useState(new Date(2025, 6, 22)); // July 22, 2025

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const isToday = (date) => {
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getWeekDates = (date) => {
    const weekStart = getWeekStart(date);
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const getMonthDates = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const dates = [];
    const currentDate = new Date(startDate);
    
    while (dates.length < 42) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    
    if (currentView === 'Day') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (currentView === 'Week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (currentView === 'Monthly') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (currentView === 'Years') {
      newDate.setFullYear(newDate.getFullYear() + direction);
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDisplayText = () => {
    if (currentView === 'Day') {
      return `${months[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    } else if (currentView === 'Week') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${months[weekStart.getMonth()]} ${weekStart.getDate()} - ${months[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${currentDate.getFullYear()}`;
    } else if (currentView === 'Monthly') {
      return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (currentView === 'Years') {
      return `${currentDate.getFullYear()}`;
    }
    return '';
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return (
      <div className="space-y-2">
        {hours.map((hour) => (
          <div key={hour} className="flex border-b border-gray-200 py-2">
            <div className="w-20 text-sm text-gray-600 font-[BasisGrotesquePro]">{hour.toString().padStart(2, '0')}:00</div>
            <div className="flex-1">
              {hour === 6 && (
                <div className="bg-orange-50 border border-orange-400 rounded-lg p-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-1 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="text-xs text-orange-700 font-[BasisGrotesquePro] mb-1">
                        Schedule a free Phone...
                      </div>
                      <div className="text-xs text-[#3AD6F2] font-[BasisGrotesquePro]">06:00 - 08:00</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);
    return (
      <>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-700 font-[BasisGrotesquePro] py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, index) => {
            const isDate22 = date.getDate() === 22 && date.getMonth() === 6;
            return (
              <div key={index} className="p-2 border border-gray-200 rounded min-h-[80px] relative">
                <div className="flex items-center justify-end mb-1">
                  {isDate22 || isToday(date) ? (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-sm font-semibold text-white font-[BasisGrotesquePro]">{date.getDate()}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">{date.getDate()}</span>
                  )}
                </div>
                {isDate22 && (
                  <div className="mt-2 bg-orange-50 border border-orange-400 rounded-lg p-2">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-1 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-orange-700 font-[BasisGrotesquePro] mb-1">
                          Schedule a free Phone...
                        </div>
                        <div className="text-xs text-[#3AD6F2] font-[BasisGrotesquePro]">06:00 - 08:00</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const renderMonthlyView = () => {
    const monthDates = getMonthDates(currentDate);
    return (
      <>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-700 font-[BasisGrotesquePro] py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {monthDates.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            return (
              <div key={index} className={`p-2 border border-gray-200 rounded text-center min-h-[60px] ${!isCurrentMonth ? 'opacity-40' : ''}`}>
                <div className="flex items-center justify-center mb-1">
                  {isToday(date) ? (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-sm font-semibold text-white font-[BasisGrotesquePro]">{date.getDate()}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">{date.getDate()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const renderYearsView = () => {
    const year = currentDate.getFullYear();
    const years = Array.from({ length: 12 }, (_, i) => year - 6 + i);
    return (
      <div className="grid grid-cols-4 gap-4">
        {years.map((y) => (
          <div
            key={y}
            className={`p-4 border border-gray-200 rounded-lg text-center cursor-pointer hover:bg-gray-50 ${
              y === today.getFullYear() ? 'bg-blue-50 border-blue-300' : ''
            }`}
            onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setFullYear(y);
              setCurrentDate(newDate);
              setCurrentView('Monthly');
            }}
          >
            <div className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro]">{y}</div>
          </div>
        ))}
      </div>
    );
  };

  const getTitle = () => {
    if (currentView === 'Day') return 'Daily Schedule';
    if (currentView === 'Week') return 'Weekly Schedule';
    if (currentView === 'Monthly') return 'Monthly Schedule';
    if (currentView === 'Years') return 'Yearly Schedule';
    return 'Schedule';
  };

  const getSubtitle = () => {
    if (currentView === 'Day') return 'Today\'s appointments and availability';
    if (currentView === 'Week') return 'Current week appointments and availability';
    if (currentView === 'Monthly') return 'Current month appointments and availability';
    if (currentView === 'Years') return 'Select a year to view';
    return 'Appointments and availability';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-4">
        <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro]">{getTitle()}</h5>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">{getSubtitle()}</p>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setCurrentView('Day')}
          className={`px-4 py-2 text-sm rounded-lg font-[BasisGrotesquePro] ${
            currentView === 'Day' ? 'bg-[#F56D2D] text-white' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          Day
        </button>
        <button
          onClick={() => setCurrentView('Week')}
          className={`px-4 py-2 text-sm rounded-lg font-[BasisGrotesquePro] ${
            currentView === 'Week' ? 'bg-[#F56D2D] text-white' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          Week
        </button>
        <button
          onClick={() => setCurrentView('Monthly')}
          className={`px-4 py-2 text-sm rounded-lg font-[BasisGrotesquePro] ${
            currentView === 'Monthly' ? 'bg-[#F56D2D] text-white' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setCurrentView('Years')}
          className={`px-4 py-2 text-sm rounded-lg font-[BasisGrotesquePro] ${
            currentView === 'Years' ? 'bg-[#F56D2D] text-white' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          Years
        </button>
      </div>
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h6 className="font-semibold text-gray-900 font-[BasisGrotesquePro]">{getDisplayText()}</h6>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 bg-[#FFFFFF] hover:bg-gray-200 rounded-lg !border border-[#E8F0FF]"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-[#FFFFFF] text-gray-700 rounded-lg font-[BasisGrotesquePro]"
            >
              Today
            </button>
            <button
              onClick={() => navigateDate(1)}
              className="p-2 bg-[#FFFFFF] hover:bg-gray-200 rounded-lg !border border-[#E8F0FF]"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        {currentView === 'Day' && renderDayView()}
        {currentView === 'Week' && renderWeekView()}
        {currentView === 'Monthly' && renderMonthlyView()}
        {currentView === 'Years' && renderYearsView()}
      </div>
    </div>
  );
}

