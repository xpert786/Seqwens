import React, { useState, useEffect } from "react";
import { AddTask, AwaitingIcon, Clocking, CompletedIcon, Contacted, DoubleuserIcon, DoubleUserIcon, FaildIcon, MiniContact, Task1, MonthIconed, ZoomIcon } from "../../component/icons";
import CreateEventModal from "./CreateEventModal";
import SetAvailabilityModal from "../../../FirmAdmin/Pages/Scheduling & calendar/SetAvailabilityModal";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
import { toast } from "react-toastify";
import ConfirmationModal from "../../../components/ConfirmationModal";
import "../../styles/Calendar.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

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
      if (!calendarData) setLoading(true);
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

  // Get dynamic cell height based on period
  const getCellHeight = () => {
    switch (selectedPeriod) {
      case "Day":
        return "min-h-[500px]";
      case "Week":
        return "min-h-[450px]";
      case "Years":
        return "min-h-[180px]";
      default: // Monthly
        return "min-h-[120px]";
    }
  };

  // Get dynamic events container max-height based on period
  const getEventsContainerMaxHeight = () => {
    switch (selectedPeriod) {
      case "Day":
        return "450px";
      case "Week":
        return "400px";
      case "Years":
        return "110px";
      default: // Monthly
        return "90px";
    }
  };

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

  if (loading && !calendarData) {
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
            className="bg-white rounded-2xl border border-[#E8F0FF] p-4 transition-all hover:bg-gray-50/20 cursor-pointer"
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


      <div className="flex flex-col xl:flex-row gap-6 w-full calendar-main-layout animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Calendar Navigation and Grid Container */}
        <div id="calendar-view-container" className="border border-[#E8F0FF] rounded-3xl pt-4 bg-white w-full xl:w-[75%] calendar-content-area">
          {/* Calendar Navigation */}
          <div className="flex justify-between items-center mb-4 calendar-nav-controls">
            <div className="flex items-center gap-3 w-full justify-start pl-4 calendar-date-title">
              <h4 className="text-xl font-bold text-[#1E293B] mb-0 tracking-tight">
                {selectedPeriod === "Monthly" && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                {selectedPeriod === "Week" && `Week of ${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`}
                {selectedPeriod === "Day" && `${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`}
                {selectedPeriod === "Years" && `${currentDate.getFullYear()}`}
              </h4>
            </div>
            <div className="flex items-center gap-2 justify-end w-full md:w-auto pr-4 calendar-nav-buttons">
              <div className="flex items-center bg-white rounded-2xl border border-[#E8F0FF] p-1">
                <button
                  className="p-2 text-gray-600 transition-all rounded-lg"
                  onClick={() => navigateCalendar(-1)}
                  title="Previous"
                >
                  <FaChevronLeft size={14} />
                </button>
                <div className="w-[1px] h-4 bg-[#E8F0FF] mx-1"></div>
                <button
                  className="px-4 py-1.5 text-[#3B4A66] font-medium transition-all text-sm rounded-lg"
                  onClick={goToToday}
                >
                  Today
                </button>
                <div className="w-[1px] h-4 bg-[#E8F0FF] mx-1"></div>
                <button
                  className="p-2 text-gray-600 transition-all rounded-lg"
                  onClick={() => navigateCalendar(1)}
                  title="Next"
                >
                  <FaChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex gap-6 px-4 pb-4">
            <div className="flex-1">
              <div className="bg-white !rounded-3xl border border-[#E8F0FF] overflow-hidden">
                {/* Day Headers */}
                {selectedPeriod !== "Day" && selectedPeriod !== "Years" && (
                  <div className="grid grid-cols-7 bg-[#F8FAFC] border-b border-[#E8F0FF]">
                    {dayNames.map(day => (
                      <div key={day} className="calendar-day-header-item p-3.5 text-center text-[11px] font-black uppercase tracking-widest text-slate-500 border-r border-[#E8F0FF] last:border-r-0">
                        <span className="day-header-full">{day}</span>
                        <span className="day-header-short">{day[0]}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedPeriod === "Years" && (
                  <div className="grid grid-cols-3 bg-[#F8FAFC] border-b border-[#E8F0FF]">
                    <div className="p-3.5 text-center text-[11px] font-black uppercase tracking-widest text-slate-500 col-span-3">Strategic Annual Overview</div>
                  </div>
                )}

                {/* Calendar Days */}
                <div className={`grid ${selectedPeriod === "Day" ? "grid-cols-1" :
                  selectedPeriod === "Years" ? "grid-cols-3" : "grid-cols-7"
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
                        className={`calendar-cell ${getCellHeight()} p-2 cursor-pointer transition-all duration-200 ${selectedPeriod === "Monthly" && !isCurrentMonthInMonthly ? 'bg-slate-50/50 text-slate-300' : 'bg-white'
                          } ${isToday ? 'bg-blue-50/30' : ''} ${isSelected ? 'ring-2 ring-inset ring-orange-500 bg-orange-50/30' : 'hover:bg-slate-50'} ${((selectedPeriod === "Monthly" || selectedPeriod === "Week") && index % 7 !== 6) || (selectedPeriod === "Years" && index % 3 !== 2) ? 'border-r border-[#E8F0FF]' : ''
                          } ${((selectedPeriod === "Monthly" || selectedPeriod === "Week") && index < (selectedPeriod === "Monthly" ? 35 : 0)) || (selectedPeriod === "Years" && index < 9) ? 'border-b border-[#E8F0FF]' : ''
                          }`}
                        onClick={() => {
                          setSelectedDate(day);
                          if (selectedPeriod === "Years") {
                            setCurrentDate(day);
                            setSelectedPeriod("Monthly");
                          }
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className={`calendar-day-number-wrapper flex items-center justify-center font-bold transition-all ${selectedPeriod === "Years" ? 'px-4 py-1.5 rounded-xl text-xs uppercase tracking-widest' : 'w-8 h-8 text-sm rounded-xl'} ${isToday ? 'bg-[#F56D2D] text-white' : 'text-slate-600 bg-slate-50'
                            }`}>
                            {displayValue}
                          </div>
                        </div>
                        <div className="calendar-tasks-container d-flex flex-column gap-1 overflow-auto custom-scrollbar" style={{ flex: 1, maxHeight: getEventsContainerMaxHeight() }}>
                          {dayEvents.map(event => (
                            <div
                              key={event.id}
                              className="calendar-task-item flex flex-col gap-0.5 p-1.5 rounded-xl text-xs mb-1 cursor-pointer transition-all"
                              style={{
                                backgroundColor: '#FFF7ED',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewEvent(event);
                              }}
                            >
                              <div className="flex items-center gap-1.5 font-semibold">
                                <span className="truncate capitalize">{event.title}</span>
                              </div>
                              <div className="opacity-80 text-[10px] font-medium">{event.time}</div>
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
        <div className="w-full xl:w-96 space-y-5 calendar-sidebar-area">
          {/* Today's Events */}
          <div className=" max-h-[380px] overflow-y-auto custom-scrollbar bg-white rounded-3xl border border-[#E8F0FF] p-3 transition-all duration-300">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-[#F56D2D] animate-pulse"></div>
              <h6 className="font-black text-slate-800 m-0 text-sm uppercase tracking-wider">Today's Schedule</h6>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-[0.15em]">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            {getTodayEvents().length === 0 ? (
              <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-xs font-medium mb-0 italic">No events today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getTodayEvents().map(event => (
                  <div key={event.id} className="group relative flex items-start gap-3 p-3 rounded-2xl bg-slate-50/30 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden" onClick={() => handleViewEvent(event)}>
                    <div className="absolute left-0 top-0 w-1 h-full bg-[#F56D2D] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex flex-col items-center shrink-0 pt-1">
                      <div className="w-1.5 h-1.5 bg-[#F56D2D] rounded-full mb-1"></div>
                      <div className="w-[1px] h-full bg-slate-100 group-last:hidden"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="capitalize font-black text-[13px] text-slate-800 truncate mb-1">{event.title}</div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                        <Clocking size={12} className="text-slate-400" /> {event.time}
                      </div>
                      {event.user && (
                        <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1.5 font-medium">
                          <MiniContact size={10} className="text-slate-300" /> <span className="truncate italic">With {event.user}</span>
                        </div>
                      )}
                      {event.appointment?.meeting_link && (
                        <button
                          onClick={() => handleLaunchMeeting(event.appointment)}
                          className="mt-3 w-full py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors rounded-lg !text-[11px] font-bold flex items-center justify-center gap-1.5"
                        >
                          <ZoomIcon size={14} /> Launch Meeting
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
            <div className="bg-white rounded-2xl border border-[#E8F0FF] p-5 shadow-sm">
              <div className="flex justify-between items-baseline mb-4">
                <h6 className="font-bold text-[#1E293B] m-0">Pending Meetings</h6>
                <button
                  onClick={() => setShowPendingMeetingsModal(true)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-bold uppercase tracking-wider"
                >
                  View All ({getPendingMeetings().length})
                </button>
              </div>
              <div className="space-y-4">
                {getPendingMeetings().slice(0, 3).map(event => (
                  <div key={event.id} className="p-3 rounded-xl bg-yellow-50/50 border border-yellow-100/50 group">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-[#1E293B] truncate">{event.title}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5 font-medium">
                          <Clocking size={12} /> {event.time}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{event.date.toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pl-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveAppointment(event);
                        }}
                        disabled={updatingStatus[event.id]}
                        className="flex-1 py-1.5 text-[11px] font-bold bg-[#32B582] text-white rounded-lg hover:bg-[#2da375] transition-colors disabled:opacity-50"
                      >
                        {updatingStatus[event.id] ? '...' : 'Approve'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelAppointment(event);
                        }}
                        disabled={updatingStatus[event.id]}
                        className="flex-1 py-1.5 text-[11px] font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {updatingStatus[event.id] ? '...' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          <div className="max-h-[380px] overflow-y-auto custom-scrollbar bg-white rounded-2xl border border-[#E8F0FF] p-3 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-300">
            <h6 className="font-black text-slate-800 mb-1 text-sm uppercase tracking-wider">Future Agenda</h6>
            <p className="text-[10px] text-slate-400 mb-4 font-bold uppercase tracking-[0.15em]">Next 5 Scheduled Events</p>
            {getUpcomingEvents().length === 0 ? (
              <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-xs font-medium mb-0 italic">Clear schedule</p>
              </div>
            ) : (
              <div className="space-y-3 ">
                {getUpcomingEvents().map(event => (
                  <div key={event.id} className="group relative flex items-start gap-3 p-3 rounded-2xl bg-slate-50/30 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden" onClick={() => handleViewEvent(event)}>
                    <div className="absolute left-0 top-0 w-1 h-full bg-[#1e293b] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex flex-col items-center shrink-0 pt-1">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mb-1 group-hover:bg-[#F56D2D] transition-colors"></div>
                      <div className="w-[1px] h-full bg-slate-100 group-last:hidden"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-[13px] text-slate-800 truncate mb-1">{event.title}</div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                        <Clocking size={12} className="text-slate-400" /> {event.time}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-1.5 font-bold uppercase">
                        <MonthIconed size={12} className="text-slate-300" /> {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      {event.user && (
                        <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1.5 font-medium italic">
                          <span className="text-slate-300">With {event.user}</span>
                        </div>
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
                          className="mt-3 w-full py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors rounded-lg !text-[11px] font-bold flex items-center justify-center gap-1.5"
                        >
                          <ZoomIcon size={14} /> Launch Meeting
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999999990] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Event Details</h3>
              <button onClick={closeViewEventModal} className="text-gray-400 transition-colors">
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
                className="w-full py-2 text-gray-500 font-medium text-sm"
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
        onSubmit={handleCreateEvent} />
      {/* Pending Meetings Modal */}
      {showPendingMeetingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000001] p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-h-[75vh] overflow-hidden flex flex-col my-auto" style={{ maxWidth: '800px' }}>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-14 py-2 rounded-2xl bg-[#3AD6F2] flex items-center justify-center text-white shadow-xl shadow-[#3AD6F2]/30">
                  <Task1 size={32} color="white" />
                </div>
                <div>
                  <h3 className="mb-0 font-black text-gray-900 tracking-tight leading-none">
                    Calendar
                  </h3>
                  <span className="text-gray-400 text-sm  font-medium tracking-tight">Manage your professional schedule and client meetings.</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <button
                  onClick={() => setIsSetAvailabilityModalOpen(true)}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white !rounded-xl text-gray-900 font-black !text-xs uppercase tracking-[0.2em] hover:bg-gray-50 transition-all rounded-[20px] shadow-sm border border-gray-200 active:scale-95 group"
                >
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-[#F56D2D] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Set Availability</span>
                </button>

                <button
                  onClick={handleOpenCreateEventModal}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#F56D2D] !rounded-xl text-white font-black !text-xs   md uppercase tracking-[0.2em] transition-all rounded-[20px] shadow-2xl shadow-[#F56D2D]/10 active:scale-95"
                >
                  <AddTask />
                  <span>Create new Event</span>
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
      )
      }

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
    </div >
  );
}

