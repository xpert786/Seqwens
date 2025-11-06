import React, { useState, useEffect } from "react";
import { AddTask, AwaitingIcon, CompletedIcon, Contacted, DoubleuserIcon, DoubleUserIcon, FaildIcon, Task1, ZoomIcon } from "../../component/icons";
import CreateEventModal from "./CreateEventModal";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
import { toast } from "react-toastify";

export default function CalendarPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("Monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsByDate, setAppointmentsByDate] = useState({});
  const [statistics, setStatistics] = useState({
    total_events: 0,
    today: 0,
    this_week: 0,
    confirmed: 0
  });
  const [showPendingMeetingsModal, setShowPendingMeetingsModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState({});

  // Fetch calendar data from API
  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error("No authentication token found");
      }

      // Calculate date range for current month
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const dateFrom = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const dateTo = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const config = {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      const apiUrl = `${API_BASE_URL}/taxpayer/tax-preparer/calendar/?date_from=${dateFrom}&date_to=${dateTo}`;
      console.log("Fetching calendar data from:", apiUrl);

      const response = await fetchWithCors(apiUrl, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
          errorData.detail ||
          `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Calendar API response:", result);

      if (result.success && result.data) {
        setCalendarData(result.data);

        // Set appointments list
        const apps = result.data.calendar?.appointments || [];
        setAppointments(apps);

        // Set appointments by date
        const appsByDate = result.data.calendar?.appointments_by_date || {};
        setAppointmentsByDate(appsByDate);

        // Set statistics
        if (result.data.statistics) {
          const stats = result.data.statistics;
          setStatistics({
            total_events: stats.total_events || 0,
            today: stats.today || 0,
            this_week: stats.this_week || 0,
            confirmed: stats.confirmed || 0
          });
        }
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      toast.error(handleAPIError(error), {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch calendar data when component mounts or month changes
  useEffect(() => {
    fetchCalendarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  // Convert API appointment to event format
  const convertAppointmentToEvent = (appointment) => {
    const appointmentDate = new Date(appointment.appointment_date);
    const timeStr = appointment.appointment_time || '00:00:00';
    const [hours, minutes] = timeStr.split(':').map(Number);
    appointmentDate.setHours(hours, minutes, 0);

    return {
      id: appointment.id,
      title: appointment.subject || `${appointment.type_display || 'Appointment'}`,
      date: appointmentDate,
      time: `${appointment.appointment_time || '00:00'}`.substring(0, 5) + (appointment.end_time ? ` - ${appointment.end_time}` : ''),
      type: appointment.appointment_type,
      confirmed: appointment.appointment_status === 'confirmed',
      status: appointment.appointment_status,
      statusDisplay: appointment.status_display,
      user: appointment.user_name,
      userEmail: appointment.user_email,
      meetingType: appointment.meeting_type_display,
      meetingLink: appointment.zoom_meeting_link || appointment.google_meet_link || appointment.meeting_link,
      zoomMeetingId: appointment.zoom_meeting_id,
      zoomMeetingPassword: appointment.zoom_meeting_password,
      formattedDatetime: appointment.formatted_datetime,
      appointment: appointment // Keep full appointment data
    };
  };

  // Launch meeting handler
  const handleLaunchMeeting = (appointment) => {
    const meetingLink = appointment.zoom_meeting_link || appointment.google_meet_link || appointment.meeting_link;

    if (meetingLink) {
      window.open(meetingLink, '_blank');
    } else {
      toast.error("Meeting link not available", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDay = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Get appointments for a specific date
  const getAppointmentsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const dateApps = appointmentsByDate[dateStr] || [];
    return dateApps.map(convertAppointmentToEvent);
  };

  const getTodayEvents = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayApps = appointmentsByDate[todayStr] || [];
    return todayApps.map(convertAppointmentToEvent);
  };

  const getUpcomingEvents = () => {
    if (!calendarData?.upcoming_events) {
      return [];
    }
    return calendarData.upcoming_events.map(convertAppointmentToEvent);
  };

  // Get pending meetings
  const getPendingMeetings = () => {
    const allAppointments = appointments || [];
    return allAppointments
      .filter(appointment => appointment.appointment_status === 'pending')
      .map(convertAppointmentToEvent)
      .sort((a, b) => a.date - b.date); // Sort by date
  };

  // Update appointment status using action API
  const updateAppointmentStatus = async (appointmentId, action, reason = null) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [appointmentId]: true }));
      
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error("No authentication token found");
      }

      const requestBody = {
        action: action
      };

      // Add reason if canceling
      if (action === 'cancel' && reason) {
        requestBody.reason = reason;
      }

      const config = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      };

      const apiUrl = `${API_BASE_URL}/taxpayer/staff/appointments/${appointmentId}/action/`;
      console.log('Appointment action API URL:', apiUrl);
      console.log('Appointment action request body:', requestBody);

      const response = await fetchWithCors(apiUrl, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
          errorData.detail ||
          `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      
      if (result.success) {
        const actionText = action === 'approve' ? 'approved' : 'cancelled';
        toast.success(`Appointment ${actionText} successfully`, {
          position: "top-right",
          autoClose: 3000,
        });
        
        // Refresh calendar data
        await fetchCalendarData();
      } else {
        throw new Error(result.message || `Failed to ${action} appointment`);
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast.error(handleAPIError(error), {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [appointmentId]: false }));
    }
  };

  // Handle approve appointment
  const handleApproveAppointment = async (event) => {
    if (window.confirm(`Are you sure you want to approve "${event.title}"?`)) {
      await updateAppointmentStatus(event.id, 'approve');
    }
  };

  // Handle cancel appointment
  const handleCancelAppointment = async (event) => {
    const reason = window.prompt(
      `Are you sure you want to cancel "${event.title}"?\n\nPlease provide a reason (optional):`
    );
    
    if (reason !== null) {
      // User clicked OK (even if they didn't enter a reason)
      await updateAppointmentStatus(event.id, 'cancel', reason || null);
    }
    // If user clicked Cancel, do nothing
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const cardData = [
    { label: "Total Events", icon: <Task1 />, count: statistics.total_events, color: "#00bcd4" },
    { label: "Today", icon: <CompletedIcon />, count: statistics.today, color: "#4caf50" },
    { label: "This Week", icon: <DoubleuserIcon />, count: statistics.this_week, color: "#3f51b5" },
    { label: "Confirmed", icon: <ZoomIcon />, count: statistics.confirmed, color: "#EF4444" },
  ];

  const timePeriods = ["Day", "Week", "Monthly", "Years"];

  // Modal handlers
  const handleOpenCreateEventModal = () => {
    setIsCreateEventModalOpen(true);
  };

  const handleCloseCreateEventModal = () => {
    setIsCreateEventModalOpen(false);
  };

  const handleCreateEvent = (eventData) => {
    // Refresh calendar after creating event
    fetchCalendarData();
    setIsCreateEventModalOpen(false);
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-[#F3F7FF] flex items-center justify-center">
        <p className="text-gray-600">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-[#F3F7FF]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900">Calendar</h3>
          <p className="text-gray-600">Manage your appointments and schedule</p>        </div>
        <button
          onClick={handleOpenCreateEventModal}
          className="btn dashboard-btn btn-upload d-flex align-items-center gap-2"
        >
          <AddTask />Create New Event
        </button>
      </div>

      {/* Stats - First 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cardData.map((item, index) => (
          <div key={index} className="bg-white rounded-lg border-[#E8F0FF] p-4">            <div className="flex justify-between items-center">
            <div style={{ color: item.color }}>
              {item.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{item.count}</div>
          </div>
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-600">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Time Period Selector */}
      <div className="flex gap-2 mb-6">
        {timePeriods.map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedPeriod === period
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`} style={{ borderRadius: '7px' }}
          >
            {period}
          </button>
        ))}
      </div>


      <div className="flex gap-6 w-full ">
        {/* Calendar Navigation and Grid Container */}
        <div className="border border-[#E8F0FF]  rounded-lg pt-2 bg-[#F3F7FF] w-[75%]">
          {/* Calendar Navigation */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3 w-full justify-start pl-2">

              <h4 className="text-lg font-semibold text-gray-900 mb-0">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h4>

            </div>
            <div className="flex items-center gap-2 justify-end w-full pr-2">
              <button
                className="px-3 py-2 border border-gray-300 hover:bg-gray-50 transition-colors border-[#E8F0FF] bg-white"
                style={{ borderRadius: '10px' }}
                onClick={() => navigateMonth(-1)}
              >
                &lt;
              </button>
              <button
                className="px-4 py-2  text-black  transition-colors text-sm border border-[#E8F0FF] bg-white"
                style={{ borderRadius: '7px' }}
                onClick={goToToday}
              >
                Today
              </button>
              <button
                className="px-3 py-2 border border-gray-300 hover:bg-gray-50 transition-colors bg-white"
                style={{ borderRadius: '10px' }}
                onClick={() => navigateMonth(1)}
              >
                &gt;
              </button>
            </div>
            <div></div>
          </div>

          {/* Calendar Grid */}
          <div className="flex gap-6">
            <div className="flex-1">
              <div className="bg-white rounded-lg  border border-gray-200 overflow-hidden">
                {/* Day Headers */}
                <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                  {dayNames.map(day => (
                    <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 border-r border-gray-200 last:border-r-0">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, index) => {
                    const dayEvents = getAppointmentsForDate(day);
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const isToday = day.toDateString() === new Date().toDateString();
                    const isSelected = day.toDateString() === selectedDate.toDateString();

                    return (
                      <div
                        key={index}
                        className={`min-h-[120px] p-2 cursor-pointer transition-colors hover:bg-[#F5F5F5] ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                          } ${isToday ? 'bg-[#F5F5F5]' : ''} ${isSelected ? 'bg-orange-50 border-orange-200' : ''
                          } ${index % 7 !== 6 ? 'border-r border-[#E8F0FF]' : ''
                          } ${index < 35 ? 'border-b border-[#E8F0FF]' : ''
                          }`}
                        onClick={() => setSelectedDate(day)}
                      >
                        <div className={`text-sm font-medium mb-1 ${isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
                          }`}>
                          {day.getDate()}
                        </div>
                        {dayEvents.map(event => (
                          <div
                            key={event.id}
                            className="bg-orange-500 text-white p-1 rounded text-xs mb-1 shadow-sm cursor-pointer hover:bg-orange-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Show event details or launch meeting
                              if (event.appointment?.meeting_link || event.appointment?.zoom_meeting_link) {
                                handleLaunchMeeting(event.appointment);
                              }
                            }}
                          >
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 bg-white rounded-full"></div>
                              <span className="truncate">{event.title}</span>
                            </div>
                            <div className="text-xs opacity-90">{event.time}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 space-y-4">
          {/* Today's Events */}
          <div className="bg-white rounded-lg  border border-[#E8F0FF] p-4">
            <h6 className="font-semibold text-gray-900 mb-2">Today's Events</h6>            <p className="text-sm text-gray-500 mb-3">
              {new Date().toLocaleDateString()}
            </p>
            {getTodayEvents().length === 0 ? (
              <p className="text-gray-500 text-sm">No events scheduled for today</p>
            ) : (
              <div className="space-y-2">
                {getTodayEvents().map(event => (
                  <div key={event.id} className="flex items-start gap-2 p-2 border-b border-gray-100 last:border-b-0">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">{event.title}</div>
                      <div className="text-xs text-gray-500">{event.time}</div>
                      {event.user && (
                        <div className="text-xs text-gray-400 mt-1">With: {event.user}</div>
                      )}
                      {event.appointment?.meeting_link && (
                        <button
                          onClick={() => handleLaunchMeeting(event.appointment)}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <ZoomIcon /> Launch Meeting
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Meetings */}
          {getPendingMeetings().length > 0 && (
            <div className="bg-white rounded-lg border border-[#E8F0FF] p-4">
              <div className="flex justify-between items-center mb-2">
                <h6 className="font-semibold text-gray-900">Pending Meetings</h6>
                <button
                  onClick={() => setShowPendingMeetingsModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  View All ({getPendingMeetings().length})
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-3">Meetings awaiting approval</p>
              <div className="space-y-2">
                {getPendingMeetings().slice(0, 3).map(event => (
                  <div key={event.id} className="flex items-start gap-2 p-2 border-b border-gray-100 last:border-b-0">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">{event.title}</div>
                      <div className="text-xs text-gray-500">{event.time}</div>
                      <div className="text-xs text-gray-400">{event.date.toLocaleDateString()}</div>
                      {event.user && (
                        <div className="text-xs text-gray-400 mt-1">With: {event.user}</div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveAppointment(event);
                          }}
                          disabled={updatingStatus[event.id]}
                          className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingStatus[event.id] ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelAppointment(event);
                          }}
                          disabled={updatingStatus[event.id]}
                          className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingStatus[event.id] ? 'Processing...' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          <div className="bg-white rounded-lg  border border-[#E8F0FF] p-4">
            <h6 className="font-semibold text-gray-900 mb-2">Upcoming Events</h6>
            <p className="text-sm text-gray-500 mb-3">Next 5 Scheduled Events</p>
            {getUpcomingEvents().length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming events</p>
            ) : (
              <div className="space-y-2">
                {getUpcomingEvents().map(event => (
                  <div key={event.id} className="flex items-start gap-2 p-2 border-b border-gray-100 last:border-b-0">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">{event.title}</div>
                      <div className="text-xs text-gray-500">{event.time}</div>
                      <div className="text-xs text-gray-400">{event.date.toLocaleDateString()}</div>
                      {event.user && (
                        <div className="text-xs text-gray-400 mt-1">With: {event.user}</div>
                      )}
                      {event.statusDisplay && (
                        <div className="text-xs mt-1">
                          <span className={`px-2 py-0.5 rounded ${event.status === 'confirmed' ? 'bg-green-100 text-green-700' : event.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                            {event.statusDisplay}
                          </span>
                        </div>
                      )}
                      {event.status === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveAppointment(event);
                            }}
                            disabled={updatingStatus[event.id]}
                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingStatus[event.id] ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelAppointment(event);
                            }}
                            disabled={updatingStatus[event.id]}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingStatus[event.id] ? 'Processing...' : 'Cancel'}
                          </button>
                        </div>
                      )}
                      {event.appointment?.meeting_link && event.status === 'confirmed' && (
                        <button
                          onClick={() => handleLaunchMeeting(event.appointment)}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <ZoomIcon /> Launch Meeting
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={handleCloseCreateEventModal}
        onSubmit={handleCreateEvent}
      />

      {/* Pending Meetings Modal */}
      {showPendingMeetingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Pending Meetings</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {getPendingMeetings().length} meeting(s) awaiting approval
                  </p>
                </div>
                <button
                  onClick={() => setShowPendingMeetingsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {getPendingMeetings().length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No pending meetings</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getPendingMeetings().map(event => (
                    <div
                      key={event.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{event.title}</h4>
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                              Pending
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Date:</span>
                              <span>{event.date.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Time:</span>
                              <span>{event.time}</span>
                            </div>
                            {event.user && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">With:</span>
                                <span>{event.user}</span>
                                {event.userEmail && (
                                  <span className="text-gray-400">({event.userEmail})</span>
                                )}
                              </div>
                            )}
                            {event.meetingType && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Type:</span>
                                <span>{event.meetingType}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => handleApproveAppointment(event)}
                            disabled={updatingStatus[event.id]}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
                          >
                            {updatingStatus[event.id] ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleCancelAppointment(event)}
                            disabled={updatingStatus[event.id]}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
                          >
                            {updatingStatus[event.id] ? 'Processing...' : 'Cancel'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowPendingMeetingsModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

