import React, { useState } from 'react';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 6, 1)); // July 2025
  const [timeframe, setTimeframe] = useState('Monthly');

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

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentDate);

  const tasksData = {
    '2025-7-4': [
      { title: 'IRS Rejection Correction', id: 1 },
      { title: 'IRS Rejection Correction', id: 2 },
      { title: 'Task 3', id: 3 },
      { title: 'Task 4', id: 4 },
      { title: 'Task 5', id: 5 },
      { title: 'Task 6', id: 6 },
      { title: 'Task 7', id: 7 },
      { title: 'Task 8', id: 8 },
      { title: 'Task 9', id: 9 }
    ],
    '2025-7-11': [
      { title: 'IRS Rejection Correction', id: 10 }
    ],
    '2025-7-15': [
      { title: 'Client Meeting', id: 11 },
      { title: 'Tax Filing', id: 12 }
    ]
  };

  const getTasksForDate = (year, month, day) => {
    const key = `${year}-${month + 1}-${day}`;
    return tasksData[key] || [];
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const navigateYear = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear() + direction, currentDate.getMonth(), 1));
  };

  const navigateDay = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getHeaderText = () => {
    if (timeframe === 'Years') {
      return `${currentDate.getFullYear()}`;
    } else if (timeframe === 'Monthly') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (timeframe === 'Week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${monthNames[startOfWeek.getMonth()]} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
      } else {
        return `${monthNames[startOfWeek.getMonth()]} ${startOfWeek.getDate()} - ${monthNames[endOfWeek.getMonth()]} ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
      }
    } else {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    }
  };

  const handleNavigation = (direction) => {
    if (timeframe === 'Years') {
      navigateYear(direction);
    } else if (timeframe === 'Monthly') {
      navigateMonth(direction);
    } else if (timeframe === 'Week') {
      navigateWeek(direction);
    } else {
      navigateDay(direction);
    }
  };

  return (
    <div className="mt-6">
      {/* View Selection Buttons */}
      <div className="flex gap-2 mb-4">
        {['Day', 'Week', 'Monthly', 'Years'].map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-2 text-sm font-medium !rounded-lg transition-colors font-[BasisGrotesquePro] ${timeframe === tf
                ? 'bg-[#F56D2D] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 !border border-[#E8F0FF]'
              }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Calendar Header with Navigation */}
      <div className="bg-[#E8F0FF] !rounded-lg !border border-[#E8F0FF] p-3 mb-4">
        <div className="flex items-center justify-between">
          <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro]">
            {getHeaderText()}
          </h5>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNavigation(-1)}
              className="bg-white p-2 hover:bg-gray-50 !rounded-lg transition-colors !border border-[#E8F0FF] flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 !rounded-lg transition-colors font-[BasisGrotesquePro] !border border-[#E8F0FF] whitespace-nowrap"
            >
              Today
            </button>
            <button
              onClick={() => handleNavigation(1)}
              className="bg-white p-2 hover:bg-gray-50 !rounded-lg transition-colors !border border-[#E8F0FF] flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Monthly View */}
      {timeframe === 'Monthly' && (
        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-6">
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {dayNames.map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-[#4A5568] py-2 font-[BasisGrotesquePro]">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {days.map((day, idx) => {
              const tasks = day.isCurrentMonth ? getTasksForDate(currentDate.getFullYear(), currentDate.getMonth(), day.date) : [];

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] !border border-[#E2E8F0] p-2 ${!day.isCurrentMonth ? 'bg-[#F7FAFC]' : 'bg-white'
                    } ${day.isToday ? 'bg-blue-50' : ''}`}
                >
                  <div className={`text-sm mb-1 font-[BasisGrotesquePro] ${day.isCurrentMonth ? 'text-[#4A5568]' : 'text-[#CBD5E0]'
                    }`}>
                    {day.date}
                  </div>

                  {tasks.length > 0 && (
                    <div className="space-y-1">
                      {tasks.slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded font-[BasisGrotesquePro] truncate"
                        >
                          {task.title}
                        </div>
                      ))}
                      {tasks.length > 2 && (
                        <div className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                          +{tasks.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {timeframe === 'Day' && (
        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-6">
          <div className="text-center">
            <h6 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]">
              {dayNames[currentDate.getDay()]}, {monthNames[currentDate.getMonth()]} {currentDate.getDate()}
            </h6>
            <div className="space-y-2">
              {getTasksForDate(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).map((task) => (
                <div
                  key={task.id}
                  className="bg-gray-100 text-gray-700 text-sm px-4 py-3 rounded font-[BasisGrotesquePro]"
                >
                  {task.title}
                </div>
              ))}
              {getTasksForDate(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).length === 0 && (
                <p className="text-gray-500 font-[BasisGrotesquePro]">No tasks for this day</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Week View */}
      {timeframe === 'Week' && (
        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-6">
          <div className="grid grid-cols-7 gap-1">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-[#4A5568] py-2 font-[BasisGrotesquePro]">
                {day}
              </div>
            ))}
            {(() => {
              const startOfWeek = new Date(currentDate);
              startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
              const weekDays = [];
              for (let i = 0; i < 7; i++) {
                const day = new Date(startOfWeek);
                day.setDate(startOfWeek.getDate() + i);
                weekDays.push(day);
              }
              return weekDays.map((day, idx) => {
                const tasks = getTasksForDate(day.getFullYear(), day.getMonth(), day.getDate());
                const isToday = day.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={idx}
                    className={`min-h-[200px] !border border-[#E2E8F0] p-2 ${isToday ? 'bg-blue-50' : 'bg-white'
                      }`}
                  >
                    <div className={`text-sm mb-2 font-[BasisGrotesquePro] ${isToday ? 'text-blue-600 font-bold' : 'text-[#4A5568]'
                      }`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded font-[BasisGrotesquePro] truncate"
                        >
                          {task.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Years View */}
      {timeframe === 'Years' && (
        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-6">
          <div className="grid grid-cols-4 gap-4">
            {(() => {
              const year = currentDate.getFullYear();
              const years = [];
              for (let i = year - 1; i <= year + 10; i++) {
                years.push(i);
              }
              return years.map((y) => (
                <div
                  key={y}
                  onClick={() => {
                    setCurrentDate(new Date(y, currentDate.getMonth(), 1));
                    setTimeframe('Monthly');
                  }}
                  className={`p-4 text-center cursor-pointer hover:bg-gray-50 rounded transition-colors !border border-[#E2E8F0] ${y === currentDate.getFullYear() ? 'bg-blue-50 !border-blue-400' : ''
                    }`}
                >
                  <div className="text-lg font-semibold text-[#4A5568] font-[BasisGrotesquePro]">
                    {y}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;

