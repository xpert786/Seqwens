import React, { useState, useEffect } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';
import CreateAppointmentModal from './CreateAppointmentModal';

export default function ScheduleTab({ staffId, staffName }) {
  const [currentView, setCurrentView] = useState('Week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    if (staffId) {
      fetchSchedule();
    }
  }, [staffId]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${API_BASE_URL}/taxpayer/staff/${staffId}/schedule/`;

      const config = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await fetchWithCors(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setScheduleData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch schedule');
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError(handleAPIError(err));
      setScheduleData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = (date = new Date()) => {
    setModalInitialDate(date);
    setSelectedAppointment(null);
    setIsCreateModalOpen(true);
  };

  const handleEditEvent = (appointment) => {
    setSelectedAppointment(appointment);
    setModalInitialDate(null);
    setIsCreateModalOpen(true);
  };

  // Helper function to check if a date matches an appointment date
  const getAppointmentsForDate = (date) => {
    if (!scheduleData || !scheduleData.schedule) return [];

    const dateStr = date.toISOString().split('T')[0];
    return scheduleData.schedule.filter(apt => apt.date === dateStr);
  };

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
    const appointments = getAppointmentsForDate(currentDate);

    return (
      <div className="space-y-2">
        {hours.map((hour) => {
          const hourAppointments = appointments.filter(apt => {
            if (!apt.start_time) return false;
            const startHour = parseInt(apt.start_time.split(':')[0]);
            return startHour === hour;
          });

          return (
            <div
              key={hour}
              className="flex border-b border-gray-200 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleCreateEvent(new Date(currentDate.setHours(hour, 0, 0, 0)))}
            >
              <div className="w-20 text-sm text-gray-600 font-[BasisGrotesquePro]">{hour.toString().padStart(2, '0')}:00</div>
              <div className="flex-1 space-y-2">
                {hourAppointments.map((apt) => {
                  const startTime = apt.start_time ? apt.start_time.substring(0, 5) : '';
                  const endTime = apt.end_time ? apt.end_time.substring(0, 5) : '';
                  const statusColor = apt.status === 'confirmed' ? 'bg-blue-50 border-blue-400' :
                    apt.status === 'pending' ? 'bg-yellow-50 border-yellow-400' :
                      'bg-gray-50 border-gray-400';
                  const statusDotColor = apt.status === 'confirmed' ? 'bg-blue-500' :
                    apt.status === 'pending' ? 'bg-yellow-500' :
                      'bg-gray-500';

                  return (
                    <div
                      key={apt.id}
                      className={`${statusColor} border rounded-lg p-2 cursor-pointer hover:shadow-sm transition-shadow`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEvent(apt);
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full ${statusDotColor} mt-1 flex-shrink-0`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-900 font-[BasisGrotesquePro] mb-1 truncate">
                            {apt.subject || apt.client_name || 'Appointment'}
                          </div>
                          {apt.client_name && (
                            <div className="text-xs text-gray-600 font-[BasisGrotesquePro] mb-1">
                              {apt.client_name}
                            </div>
                          )}
                          <div className="text-xs text-[#3AD6F2] font-[BasisGrotesquePro]">
                            {startTime} - {endTime}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
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
            const dateAppointments = getAppointmentsForDate(date);
            const isCurrentDate = isToday(date);

            return (
              <div
                key={index}
                className="p-2 border border-gray-200 rounded min-h-[80px] relative hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleCreateEvent(date)}
              >
                <div className="flex items-center justify-end mb-1">
                  {isCurrentDate ? (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-sm font-semibold text-white font-[BasisGrotesquePro]">{date.getDate()}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">{date.getDate()}</span>
                  )}
                </div>
                <div className="space-y-1 mt-2">
                  {dateAppointments.slice(0, 2).map((apt) => {
                    const startTime = apt.start_time ? apt.start_time.substring(0, 5) : '';
                    const statusColor = apt.status === 'confirmed' ? 'bg-blue-50 border-blue-400' :
                      apt.status === 'pending' ? 'bg-yellow-50 border-yellow-400' :
                        'bg-gray-50 border-gray-400';
                    const statusDotColor = apt.status === 'confirmed' ? 'bg-blue-500' :
                      apt.status === 'pending' ? 'bg-yellow-500' :
                        'bg-gray-500';
                    return (
                      <div
                        key={apt.id}
                        className={`${statusColor} border rounded-lg p-1.5 cursor-pointer hover:shadow-sm`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEvent(apt);
                        }}
                      >
                        <div className="flex items-start gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${statusDotColor} mt-0.5 flex-shrink-0`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900 font-[BasisGrotesquePro] truncate">
                              {apt.subject || apt.client_name || 'Appointment'}
                            </div>
                            <div className="text-xs text-[#3AD6F2] font-[BasisGrotesquePro]">{startTime}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {dateAppointments.length > 2 && (
                    <div className="text-xs text-gray-500 font-[BasisGrotesquePro] text-center">
                      +{dateAppointments.length - 2} more
                    </div>
                  )}
                </div>
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
            const dateAppointments = getAppointmentsForDate(date);
            const hasAppointments = dateAppointments.length > 0;

            return (
              <div
                key={index}
                className={`p-1 border border-gray-200 rounded text-center min-h-[60px] ${!isCurrentMonth ? 'opacity-40' : 'hover:bg-gray-50 cursor-pointer transition-colors'}`}
                onClick={() => {
                  if (isCurrentMonth) handleCreateEvent(date);
                }}
              >
                <div className="flex items-center justify-center mb-1">
                  {isToday(date) ? (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-sm font-semibold text-white font-[BasisGrotesquePro]">{date.getDate()}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">{date.getDate()}</span>
                  )}
                </div>
                {hasAppointments && isCurrentMonth && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {dateAppointments.slice(0, 3).map((apt, aptIndex) => {
                      const statusDotColor = apt.status === 'confirmed' ? 'bg-blue-500' :
                        apt.status === 'pending' ? 'bg-yellow-500' :
                          'bg-gray-500';
                      return (
                        <div key={apt.id || aptIndex} className={`w-1.5 h-1.5 rounded-full ${statusDotColor}`}></div>
                      );
                    })}
                    {dateAppointments.length > 3 && (
                      <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">+{dateAppointments.length - 3}</span>
                    )}
                  </div>
                )}
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
            className={`p-4 border border-gray-200 rounded-lg text-center cursor-pointer hover:bg-gray-50 ${y === today.getFullYear() ? 'bg-blue-50 border-blue-300' : ''
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

  if (loading && !scheduleData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <div>
          <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro]">{getTitle()}</h5>
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">
            {scheduleData?.total_meetings ? `${scheduleData.total_meetings} meeting${scheduleData.total_meetings !== 1 ? 's' : ''} scheduled` : getSubtitle()}
          </p>
        </div>
        <button
          onClick={() => handleCreateEvent()}
          className="px-4 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Appointment
        </button>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setCurrentView('Day')}
          className={`px-4 py-2 text-sm rounded-lg font-[BasisGrotesquePro] ${currentView === 'Day' ? 'bg-[#F56D2D] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
        >
          Day
        </button>
        <button
          onClick={() => setCurrentView('Week')}
          className={`px-4 py-2 text-sm rounded-lg font-[BasisGrotesquePro] ${currentView === 'Week' ? 'bg-[#F56D2D] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
        >
          Week
        </button>
        <button
          onClick={() => setCurrentView('Monthly')}
          className={`px-4 py-2 text-sm rounded-lg font-[BasisGrotesquePro] ${currentView === 'Monthly' ? 'bg-[#F56D2D] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setCurrentView('Years')}
          className={`px-4 py-2 text-sm rounded-lg font-[BasisGrotesquePro] ${currentView === 'Years' ? 'bg-[#F56D2D] text-white' : 'text-gray-700 hover:bg-gray-50'
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

      {/* Create Appointment Modal */}
      <CreateAppointmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchSchedule();
        }}
        staffId={staffId}
        staffName={staffName}
        initialDate={modalInitialDate}
        appointment={selectedAppointment}
      />
    </div>
  );
}
