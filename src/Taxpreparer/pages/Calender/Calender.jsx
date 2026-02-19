import React, { useState, useEffect } from "react";
import { AddTask, AwaitingIcon, CompletedIcon, Contacted, DoubleuserIcon, DoubleUserIcon, FaildIcon, Task1, ZoomIcon } from "../../component/icons";
import CreateEventModal from "./CreateEventModal";
import SetAvailabilityModal from "../../../FirmAdmin/Pages/Scheduling & calendar/SetAvailabilityModal";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
import { toast } from "react-toastify";
import ConfirmationModal from "../../../components/ConfirmationModal";
import "../../styles/Calendar.css";

export default function CalendarPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("Monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isSetAvailabilityModalOpen, setIsSetAvailabilityModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsByDate, setAppointmentsByDate] = useState({});
  const [showApproveEventConfirm, setShowApproveEventConfirm] = useState(false);
  const [eventToApprove, setEventToApprove] = useState(null);
  const [statistics, setStatistics] = useState({
    total_events: 0,
    today: 0,
    this_week: 0,
    confirmed: 0
  });
  const [showPendingMeetingsModal, setShowPendingMeetingsModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'confirmed'
  const [viewEventModalOpen, setViewEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setViewEventModalOpen(true);
  };

  const closeViewEventModal = () => {
    setViewEventModalOpen(false);
    setSelectedEvent(null);
  };

  // Fetch calendar data from API
  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error("No authentication token found");
      }

      // Calculate date range based on selected period
      let dateFrom, dateTo;
      const year = currentDate.getFullYear();

      if (selectedPeriod === "Years") {
        dateFrom = `${year}-01-01`;
        dateTo = `${year}-12-31`;
      } else if (selectedPeriod === "Monthly") {
        const month = currentDate.getMonth();
        dateFrom = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        dateTo = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      } else if (selectedPeriod === "Week") {
        const startDate = new Date(currentDate);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);

        dateFrom = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
        dateTo = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
      } else { // Day
        const dateStr = formatDateKey(currentDate);
        dateFrom = dateStr;
        dateTo = dateStr;
      }

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
  }, [currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), selectedPeriod]);

  // Convert 24-hour time to 12-hour AM/PM format
  const convertTo12HourFormat = (timeStr) => {
    if (!timeStr) return '';

    // If already in 12-hour format (contains AM/PM), return as is
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      return timeStr;
    }

    // Extract hours and minutes from 24-hour format (HH:MM:SS or HH:MM)
    const timeParts = timeStr.split(':');
    if (timeParts.length < 2) return timeStr;

    let hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    const formattedMinutes = minutes.padStart(2, '0');
    return `${hours}:${formattedMinutes} ${ampm}`;
  };

  // Convert API appointment to event format
  const formatDateKey = (dateObj) => {
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  };

  const convertAppointmentToEvent = (appointment) => {
    const dateParts = (appointment.appointment_date || '').split('-').map(Number);
    const [year, month, day] = [
      dateParts[0] || new Date().getFullYear(),
      (dateParts[1] || 1) - 1,
      dateParts[2] || 1,
    ];

    const timeStr = appointment.appointment_time || '00:00:00';
    const [hours = 0, minutes = 0] = timeStr.split(':').map(Number);

    // Construct date in local time to avoid timezone shift
    const appointmentDate = new Date(year, month, day, hours, minutes, 0, 0);

    // Convert start time to AM/PM format
    const startTime = convertTo12HourFormat(appointment.appointment_time || '00:00:00');

    // Use end_time from API if available (check if already in AM/PM format)
    let endTime;
    if (appointment.end_time) {
      // If end_time already contains AM/PM, use it directly; otherwise convert
      endTime = appointment.end_time.includes('AM') || appointment.end_time.includes('PM')
        ? appointment.end_time
        : convertTo12HourFormat(appointment.end_time);
    } else {
      // Calculate end time based on duration
      const durationMinutes = appointment.appointment_duration || 30;
      const totalMinutes = hours * 60 + minutes + durationMinutes;
      const endHours = Math.floor(totalMinutes / 60) % 24;
      const endMins = totalMinutes % 60;
      endTime = convertTo12HourFormat(`${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00`);
    }

    const timeDisplay = `${startTime} - ${endTime}`;

    return {
      id: appointment.id,
      title: appointment.subject || `${appointment.type_display || 'Appointment'}`,
      date: appointmentDate,
      dateKey: formatDateKey(appointmentDate),
      time: timeDisplay,
      timeSort: hours * 60 + minutes, // For sorting purposes
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

    if (selectedPeriod === "Monthly") {
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
    } else if (selectedPeriod === "Week") {
      // Find the Sunday of the current week
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - startDate.getDay());

      const days = [];
      const currentDay = new Date(startDate);
      for (let i = 0; i < 7; i++) {
        days.push(new Date(currentDay));
        currentDay.setDate(currentDay.getDate() + 1);
      }
      return days;
    } else if (selectedPeriod === "Day") {
      return [new Date(currentDate)];
    } else if (selectedPeriod === "Years") {
      const days = [];
      for (let i = 0; i < 12; i++) {
        days.push(new Date(year, i, 1));
      }
      return days;
    }

    return [];
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateCalendar = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (selectedPeriod === "Monthly") {
        newDate.setMonth(newDate.getMonth() + direction);
      } else if (selectedPeriod === "Week") {
        newDate.setDate(newDate.getDate() + (direction * 7));
      } else if (selectedPeriod === "Day") {
        newDate.setDate(newDate.getDate() + direction);
      } else if (selectedPeriod === "Years") {
        newDate.setFullYear(newDate.getFullYear() + direction);
      }
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
    const dateStr = formatDateKey(date);
    const dateApps = appointmentsByDate[dateStr] || [];
    let events = dateApps.map(convertAppointmentToEvent);

    if (filterStatus === 'confirmed') {
      events = events.filter(e => e.status === 'confirmed' || e.status === 'Confirmed');
    }

    // Sort appointments by time (earliest first)
    return events.sort((a, b) => (a.timeSort || 0) - (b.timeSort || 0));
  };

  const getTodayEvents = () => {
    const today = new Date();
    const todayStr = formatDateKey(today);
    const todayApps = appointmentsByDate[todayStr] || [];
    const events = todayApps.map(convertAppointmentToEvent);
    // Sort appointments by time (earliest first)
    return events.sort((a, b) => (a.timeSort || 0) - (b.timeSort || 0));
  };

  const getUpcomingEvents = () => {
    if (!calendarData?.upcoming_events) {
      return [];
    }
    const events = calendarData.upcoming_events.map(convertAppointmentToEvent);
    // Sort by date and time (earliest first)
    return events.sort((a, b) => {
      const dateCompare = a.date - b.date;
      if (dateCompare !== 0) return dateCompare;
      return (a.timeSort || 0) - (b.timeSort || 0);
    });
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
    setEventToApprove(event);
    setShowApproveEventConfirm(true);
  };

  const confirmApproveEvent = async () => {
    if (!eventToApprove) return;
    await updateAppointmentStatus(eventToApprove.id, 'approve');
    setShowApproveEventConfirm(false);
    setEventToApprove(null);
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
    { label: "Total Events", icon: <Task1 />, count: statistics.total_events, color: "#00bcd4", type: 'total' },
    { label: "Today", icon: <CompletedIcon />, count: statistics.today, color: "#4caf50", type: 'today' },
    { label: "This Week", icon: <DoubleuserIcon />, count: statistics.this_week, color: "#3f51b5", type: 'week' },
    { label: "Confirmed", icon: <ZoomIcon />, count: statistics.confirmed, color: "#EF4444", type: 'confirmed' },
  ];

  const handleStatClick = (type) => {
    const calendarElement = document.getElementById('calendar-view-container');
    const scroll = () => {
      if (calendarElement) {
        calendarElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Add highlight effect
        calendarElement.style.transition = 'box-shadow 0.3s ease';
        calendarElement.style.boxShadow = '0 0 0 4px rgba(0, 188, 212, 0.2)';
        setTimeout(() => {
          calendarElement.style.boxShadow = 'none';
        }, 1500);
      }
    };

    switch (type) {
      case 'total':
        setFilterStatus('all');
        setSelectedPeriod('Monthly');
        goToToday();
        setTimeout(scroll, 100);
        break;
      case 'today':
        setFilterStatus('all');
        setSelectedPeriod('Day');
        goToToday();
        setTimeout(scroll, 100);
        break;
      case 'week':
        setFilterStatus('all');
        setSelectedPeriod('Week');
        goToToday();
        setTimeout(scroll, 100);
        break;
      case 'confirmed':
        setFilterStatus('confirmed');
        // Stay in current view but filter
        setTimeout(scroll, 100);
        break;
      default:
        break;
    }
  };

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
    <div className="calendar-page-container lg:p-6 md:p-4 p-2 min-h-screen bg-[#F3F7FF]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 calendar-header-section">
        <div>
          <h4 className="text-2xl font-bold text-gray-900" style={{ color: '#1E293B' }}>Calendar</h4>
          <p className="text-gray-600 text-sm">Manage your appointments and schedule</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsSetAvailabilityModalOpen(true)}
            className="btn dashboard-btn d-flex align-items-center gap-2"
            style={{
              background: "white",
              border: "1px solid #E8F0FF",
              color: "#3B4A66",
              borderRadius: "12px"
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Set Availability
          </button>

          <button
            onClick={handleOpenCreateEventModal}
            className="btn dashboard-btn btn-upload d-flex align-items-center gap-2"
          >
            <AddTask />Create New Event
          </button>
        </div>
      </div>

      {/* Stats - First 4 Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 calendar-stats-grid">
        {cardData.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-xl border border-[#E8F0FF] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleStatClick(item.type)}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                {item.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900" style={{ color: '#1E293B' }}>{item.count}</div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 text-uppercase tracking-wider m-0">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Time Period Selector */}
      <div className="flex gap-2 mb-6 period-buttons-container">
        {timePeriods.map((period) => (
          <button
            key={period}
            onClick={() => {
              setSelectedPeriod(period);
              if (period === "Day") {
                const today = new Date();
                setCurrentDate(today);
                setSelectedDate(today);
              }
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedPeriod === period
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`} style={{ borderRadius: '7px' }}
          >
            {period}
          </button>
        ))}
      </div>


      <div className="flex flex-col lg:flex-row gap-6 w-full calendar-main-layout">
        {/* Calendar Navigation and Grid Container */}
        <div id="calendar-view-container" className="border border-[#E8F0FF] rounded-lg pt-2 bg-[#F3F7FF] w-full lg:w-[75%] calendar-content-area">
          {/* Calendar Navigation */}
          <div className="flex justify-between items-center mb-2 calendar-nav-controls">
            <div className="flex items-center gap-3 w-full justify-start pl-2 calendar-date-title">

              <h4 className="text-lg font-semibold text-gray-900 mb-0">
                {selectedPeriod === "Monthly" && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                {selectedPeriod === "Week" && `Week of ${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`}
                {selectedPeriod === "Day" && `${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`}
                {selectedPeriod === "Years" && `${currentDate.getFullYear()}`}
              </h4>

            </div>
            <div className="flex items-center gap-2 justify-end w-full md:w-auto pr-2 calendar-nav-buttons">
              <button
                className="px-3 py-2 border border-gray-300 hover:bg-gray-50 transition-colors border-[#E8F0FF] bg-white"
                style={{ borderRadius: '10px' }}
                onClick={() => navigateCalendar(-1)}
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
                onClick={() => navigateCalendar(1)}
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
                {selectedPeriod !== "Day" && selectedPeriod !== "Years" && (
                  <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                    {dayNames.map(day => (
                      <div key={day} className="calendar-day-header-item p-3 text-center text-sm font-semibold text-gray-600 border-r border-gray-200 last:border-r-0">
                        <span className="day-header-full">{day.toUpperCase()}</span>
                        <span className="day-header-short">{day[0].toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedPeriod === "Years" && (
                  <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-200">
                    <div className="p-3 text-center text-sm font-semibold text-gray-600 col-span-4">Months</div>
                  </div>
                )}

                {/* Calendar Days */}
                <div className={`grid ${selectedPeriod === "Day" ? "grid-cols-1" :
                  selectedPeriod === "Years" ? "grid-cols-4" : "grid-cols-7"
                  }`}>
                  {calendarDays.map((day, index) => {
                    const dayEvents = getAppointmentsForDate(day);
                    const isToday = day.toDateString() === new Date().toDateString();
                    const isSelected = day.toDateString() === selectedDate.toDateString();

                    // For Years view, show month name instead of date
                    const displayValue = selectedPeriod === "Years" ? monthNames[day.getMonth()] : day.getDate();
                    const isCurrentMonthInMonthly = selectedPeriod === "Monthly" && day.getMonth() === currentDate.getMonth();

                    return (
                      <div
                        key={index}
                        className={`calendar-cell min-h-[120px] p-2 cursor-pointer transition-colors hover:bg-[#F5F5F5] ${selectedPeriod === "Monthly" && !isCurrentMonthInMonthly ? 'bg-gray-50 text-gray-400' : 'bg-white'
                          } ${isToday ? 'bg-[#F5F5F5]' : ''} ${isSelected ? 'bg-orange-50 border-orange-200' : ''
                          } ${((selectedPeriod === "Monthly" || selectedPeriod === "Week") && index % 7 !== 6) || (selectedPeriod === "Years" && index % 4 !== 3) ? 'border-r border-[#E8F0FF]' : ''
                          } ${((selectedPeriod === "Monthly" || selectedPeriod === "Week") && index < (selectedPeriod === "Monthly" ? 35 : 0)) || (selectedPeriod === "Years" && index < 8) ? 'border-b border-[#E8F0FF]' : ''
                          }`}
                        onClick={() => {
                          setSelectedDate(day);
                          if (selectedPeriod === "Years") {
                            setCurrentDate(day);
                            setSelectedPeriod("Monthly");
                          }
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <div className={`calendar-day-number-wrapper text-sm font-medium ${isToday ? 'bg-blue-500 text-white rounded-full px-2 py-1 flex items-center justify-center' : ''
                            }`}>
                            {displayValue}
                          </div>

                        </div>
                        <div className="calendar-tasks-container d-flex flex-column gap-1 overflow-auto" style={{ flex: 1, maxHeight: '90px' }}>
                          {dayEvents.map(event => (
                            <div
                              key={event.id}
                              className="calendar-task-item bg-orange-500 text-white p-1 rounded text-xs mb-1 shadow-sm cursor-pointer hover:bg-orange-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewEvent(event);
                              }}
                            >
                              <div className="flex items-center gap-1">
                                <div className="w-1 h-1 bg-white rounded-full"></div>
                                <span className="truncate">{event.title}</span>
                              </div>
                              <div className="opacity-90 calendar-task-time" style={{ fontSize: '9px', lineHeight: '1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.time}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 space-y-4 calendar-sidebar-area">
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

      {/* View Event Modal */}
      {viewEventModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999999] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Event Details</h3>
              <button onClick={closeViewEventModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Event Title */}
              <h4 className="text-xl font-bold text-gray-800">{selectedEvent.title}</h4>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="w-8 flex justify-center text-xl">📅</div>
                  <div>
                    <p className="font-semibold text-gray-900">Date & Time</p>
                    <p>{selectedEvent.date.toLocaleDateString()} at {selectedEvent.time}</p>
                  </div>
                </div>

                {(selectedEvent.user || selectedEvent.appointment?.user_name) && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 flex justify-center text-xl">👤</div>
                    <div>
                      <p className="font-semibold text-gray-900">Client</p>
                      <p>{selectedEvent.user || selectedEvent.appointment?.user_name}</p>
                      {(selectedEvent.userEmail || selectedEvent.appointment?.user_email) && (
                        <p className="text-xs text-gray-500">{selectedEvent.userEmail || selectedEvent.appointment?.user_email}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Meeting Type */}
                {(selectedEvent.meetingType || selectedEvent.appointment?.meeting_type) && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 flex justify-center text-xl">🎥</div>
                    <div>
                      <p className="font-semibold text-gray-900">Meeting Type</p>
                      <p className="capitalize">{(selectedEvent.meetingType || selectedEvent.appointment?.meeting_type || '').replace('_', ' ')}</p>
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div className="flex items-center gap-3">
                  <div className="w-8 flex justify-center text-xl">🏷️</div>
                  <div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide inline-block ${selectedEvent.status === 'confirmed' ? 'bg-green-100 text-green-700' : selectedEvent.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                      {selectedEvent.statusDisplay || selectedEvent.status}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {selectedEvent.appointment?.description && (
                  <div className="mt-2 text-gray-500 italic border-l-2 border-gray-200 pl-3">
                    "{selectedEvent.appointment.description}"
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-3">
              {/* Launch Meeting Button */}
              {(selectedEvent.appointment?.meeting_link || selectedEvent.appointment?.zoom_meeting_link || selectedEvent.appointment?.google_meet_link) && selectedEvent.status !== 'cancelled' && (
                <button
                  onClick={() => handleLaunchMeeting(selectedEvent.appointment)}
                  className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2"
                >
                  <ZoomIcon className="w-5 h-5" /> Join Meeting
                </button>
              )}

              {/* Pending Actions */}
              {selectedEvent.status === 'pending' && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      handleApproveAppointment(selectedEvent);
                      closeViewEventModal();
                    }}
                    className="py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-md shadow-green-200"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      handleCancelAppointment(selectedEvent);
                      closeViewEventModal();
                    }}
                    className="py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-md shadow-red-200"
                  >
                    Decline
                  </button>
                </div>
              )}

              {/* Cancel Button for Confirmed Appointments */}
              {selectedEvent.status === 'confirmed' && (
                <button
                  onClick={() => {
                    handleCancelAppointment(selectedEvent);
                    closeViewEventModal();
                  }}
                  className="w-full py-2 bg-white hover:bg-gray-50 text-red-500 border border-red-200 font-semibold rounded-xl transition-all text-sm"
                >
                  Cancel Appointment
                </button>
              )}

              <button
                onClick={closeViewEventModal}
                className="w-full py-2 text-gray-500 hover:text-gray-700 font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Availability Modal */}
      <SetAvailabilityModal
        isOpen={isSetAvailabilityModalOpen}
        onClose={() => setIsSetAvailabilityModalOpen(false)}
        onSuccess={fetchCalendarData}
        isTaxpayer={true}
      />

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={handleCloseCreateEventModal}
        onSubmit={handleCreateEvent}
      />

      {/* Pending Meetings Modal */}
      {showPendingMeetingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999] p-4" style={{ padding: '40px 1rem', overflowY: 'auto' }}>
          <div className="bg-white rounded-lg shadow-xl  max-h-[80vh] overflow-hidden flex flex-col" style={{ marginTop: '63px', maxWidth: '664px' }}>
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

      {/* Approve Event Confirmation Modal */}
      <ConfirmationModal
        isOpen={showApproveEventConfirm}
        onClose={() => {
          setShowApproveEventConfirm(false);
          setEventToApprove(null);
        }}
        onConfirm={confirmApproveEvent}
        title="Approve Appointment"
        message={eventToApprove ? `Are you sure you want to approve "${eventToApprove.title}"?` : "Are you sure you want to approve this appointment?"}
        confirmText="Approve"
        cancelText="Cancel"
      />
    </div>
  );
}

