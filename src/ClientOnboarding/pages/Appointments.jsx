import React, { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { BsCameraVideo } from "react-icons/bs";
import { toast } from "react-toastify";
import { DateIcon, AwaitingIcon, MobileIcon, PersonIcon, DiscusIcon, EditIcon, DeleteIcon, AppoinIcon, MonthIcon, ZoomIcon, EsternTimeIcon, CrossIcon } from "../components/icons";
import { appointmentsAPI, adminAvailabilityAPI, timeSlotsAPI, staffAPI, handleAPIError } from "../utils/apiUtils";
import "../styles/Icon.css"
import "../styles/fonts.css"
export default function Appointments() {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedBox, setSelectedBox] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null); // Store full time slot object
  const [highlightBox, setHighlightBox] = useState(null);

  // API state management
  const [appointments, setAppointments] = useState({
    upcoming: [],
    past: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Appointment creation state
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    appointment_with: 1, // Default admin ID
    duration: '1 hour', // Default duration
    timezone: 'eastern' // Default timezone
  });

  // Appointment editing state
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updatingAppointment, setUpdatingAppointment] = useState(false);
  const [editFormData, setEditFormData] = useState({
    subject: '',
    appointment_date: '',
    appointment_time: '',
    appointment_type: 'consultation'
  });

  // Time slots and availability state
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [adminAvailability, setAdminAvailability] = useState({});
  const [selectedAdminId, setSelectedAdminId] = useState(1);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [loadingAvailableDates, setLoadingAvailableDates] = useState(false);

  // Staff members state
  const [staffMembers, setStaffMembers] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffError, setStaffError] = useState(null);


  const dates = Array.from({ length: 30 }, (_, i) => i + 1);
  const times = [
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
  ]
  // Function to format appointment data from API
  const formatAppointmentData = (apiData) => {
    const now = new Date();
    const upcoming = [];
    const past = [];

    apiData.forEach(appointment => {
      const appointmentDate = new Date(appointment.appointment_date);
      const appointmentTime = appointment.appointment_time;
      const duration = appointment.appointment_duration || 30;

      // Calculate end time
      const [hours, minutes] = appointmentTime.split(':');
      const startTime = new Date(appointmentDate);
      startTime.setHours(parseInt(hours), parseInt(minutes));
      const endTime = new Date(startTime.getTime() + duration * 60000);

      const formattedAppointment = {
        id: appointment.id,
        title: appointment.subject || 'Appointment',
        status: appointment.appointment_status === 'scheduled' ? 'Confirmed' :
          appointment.appointment_status === 'completed' ? 'Complete' :
            appointment.appointment_status === 'cancelled' ? 'Cancelled' : 'Pending',
        date: appointmentDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        time: `${startTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })} - ${endTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })}`,
        person: appointment.admin_name || 'Tax Professional',
        description: appointment.subject || 'Tax consultation',
        type: appointment.appointment_type === 'consultation' ? 'Zoom Meeting' : 'Phone Call',
        joinable: appointment.appointment_status === 'scheduled' && appointment.zoom_link,
        zoom_link: appointment.zoom_link,
        admin_email: appointment.admin_email,
        client_name: appointment.client_name,
        client_email: appointment.client_email,
        created_at: appointment.created_at,
        updated_at: appointment.updated_at
      };

      if (appointmentDate >= now) {
        upcoming.push(formattedAppointment);
      } else {
        past.push(formattedAppointment);
      }
    });

    // Sort upcoming by date (earliest first)
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    // Sort past by date (most recent first)
    past.sort((a, b) => new Date(b.date) - new Date(a.date));

    return { upcoming, past };
  };

  // Function to fetch appointments from API
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentsAPI.getAllAppointments();

      if (response.success && response.data) {
        const formattedData = formatAppointmentData(response.data);
        setAppointments(formattedData);
      } else {
        throw new Error(response.message || 'Failed to fetch appointments');
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(handleAPIError(err));
      // Set empty data on error
      setAppointments({ upcoming: [], past: [] });
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch staff members from API
  const fetchStaffMembers = async () => {
    try {
      setLoadingStaff(true);
      setStaffError(null);
      const response = await staffAPI.getAvailableStaff();

      // Check if API returned an error response
      if (response.success === false) {
        // Handle specific error message about firm association
        if (response.message && response.message.includes('associated with a firm')) {
          setStaffError('You need to be associated with a firm to schedule appointments. Please contact support for assistance.');
        } else {
          setStaffError(response.message || 'Unable to load staff members. Please try again later.');
        }
        setStaffMembers([]);
        return;
      }

      // Handle both response formats: available_staff or staff_members
      const staffList = response.data?.staff_members || response.data?.available_staff || [];

      if (response.success && response.data && staffList.length > 0) {
        setStaffMembers(staffList);
        // Set the first staff member as default selected
        if (staffList.length > 0) {
          setSelectedAdminId(staffList[0].id);
          setFormData(prev => ({ ...prev, appointment_with: staffList[0].id }));
        }
      } else {
        setStaffError('No staff members available. Please contact support.');
        setStaffMembers([]);
      }
    } catch (err) {
      console.error('Error fetching staff members:', err);
      // Check if error message contains firm association message
      const errorMessage = err.message || handleAPIError(err);
      if (errorMessage.includes('associated with a firm')) {
        setStaffError('You need to be associated with a firm to schedule appointments. Please contact support for assistance.');
      } else {
        setStaffError(handleAPIError(err));
      }
      setStaffMembers([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  // Function to create appointment
  const createAppointment = async () => {
    if (!selectedDate || !selectedTime || !formData.subject.trim()) {
      toast.error('Please fill in all required fields', {
        position: "top-right",
        autoClose: 3000,
        className: "custom-toast-success",
        bodyClassName: "custom-toast-body",
      });
      return;
    }

    try {
      setCreatingAppointment(true);

      // Convert selected date and time to API format
      let appointmentDate;
      if (selectedCalendarDate) {
        // Use the full date from calendar
        appointmentDate = `${selectedCalendarDate.getFullYear()}-${String(selectedCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(selectedCalendarDate.getDate()).padStart(2, '0')}`;
      } else {
        // Fallback to old format if calendar date not set
        const currentYear = new Date().getFullYear();
        appointmentDate = `${currentYear}-06-${selectedDate.toString().padStart(2, '0')}`;
      }

      // Convert time from "09:00 AM" format to "14:30" format (24-hour, no seconds)
      const time12Hour = selectedTime;
      const [time, period] = time12Hour.split(' ');
      const [hours, minutes] = time.split(':');
      let hour24 = parseInt(hours);
      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;
      const appointmentTime = `${hour24.toString().padStart(2, '0')}:${minutes}`;

      // Calculate duration from selected time slot (in minutes)
      let appointmentDuration = 30; // Default to 30 minutes
      if (selectedTimeSlot && selectedTimeSlot.start_time && selectedTimeSlot.end_time) {
        const start = new Date(`2000-01-01 ${selectedTimeSlot.start_time}`);
        const end = new Date(`2000-01-01 ${selectedTimeSlot.end_time}`);
        const diffMs = end - start;
        appointmentDuration = diffMs / (1000 * 60); // Convert to minutes
      }

      const appointmentData = {
        appointment_with_id: formData.appointment_with,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        appointment_duration: appointmentDuration,
        appointment_type: 'consultation', // Always consultation (Zoom call) since we only have one option
        subject: formData.subject,
        description: formData.description
      };

      const response = await appointmentsAPI.createAppointment(appointmentData);

      if (response.success) {
        toast.success('Appointment created successfully!', {
          position: "top-right",
          autoClose: 3000,
          className: "custom-toast-success",
          bodyClassName: "custom-toast-body",
        });

        // Reset form
        setFormData({ subject: '', description: '', appointment_with: 1, duration: '1 hour', timezone: 'eastern' });
        setSelectedDate(null);
        setSelectedTime(null);
        setSelectedTimeSlot(null);
        setSelectedBox(null);
        setStep(1);

        // Refresh appointments list
        await fetchAppointments();

        // Close modal after a short delay
        setTimeout(() => {
          setShowModal(false);
        }, 1000);
      } else {
        throw new Error(response.message || 'Failed to create appointment');
      }
    } catch (err) {
      console.error('Error creating appointment:', err);
      toast.error(handleAPIError(err) || 'Failed to create appointment', {
        position: "top-right",
        autoClose: 3000,
        className: "custom-toast-success",
        bodyClassName: "custom-toast-body",
      });
    } finally {
      setCreatingAppointment(false);
    }
  };

  // Function to cancel appointment
  const cancelAppointment = async (appointmentId) => {
    // Use toast for confirmation instead of window.confirm
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const response = await appointmentsAPI.deleteAppointment(appointmentId);

      if (response.success) {
        // Refresh appointments list
        await fetchAppointments();
        toast.success('Appointment cancelled successfully', {
          position: "top-right",
          autoClose: 3000,
          className: "custom-toast-success",
          bodyClassName: "custom-toast-body",
        });
      } else {
        throw new Error(response.message || 'Failed to cancel appointment');
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      toast.error(handleAPIError(err) || 'Failed to cancel appointment', {
        position: "top-right",
        autoClose: 3000,
        className: "custom-toast-success",
        bodyClassName: "custom-toast-body",
      });
    }
  };

  // Function to fetch time slots for a specific date
  const fetchTimeSlots = async (adminId, date) => {
    try {
      setLoadingTimeSlots(true);
      console.log('Fetching time slots for admin:', adminId, 'date:', date);

      // Use the new staff API endpoint for time slots
      const response = await staffAPI.getAvailableTimeSlots(adminId, date);
      console.log('Time slots API response:', response);

      if (response.success && response.data && response.data.available_slots) {
        // Map the new API response format to the existing format
        const slots = response.data.available_slots
          .filter(slot => slot.is_available && !slot.is_booked)
          .map(slot => {
            // Extract start time from formatted_time (e.g., "09:00 AM - 09:30 AM" -> "09:00 AM")
            const startTime = slot.formatted_time ? slot.formatted_time.split(' - ')[0] : slot.start_time;
            return {
              time: slot.formatted_time,
              start_time: slot.start_time,
              end_time: slot.end_time,
              formatted_time: slot.formatted_time,
              start_time_display: startTime,
              is_available: slot.is_available,
              is_booked: slot.is_booked
            };
          });
        console.log('Available time slots:', slots);
        setAvailableTimeSlots(slots);
      } else {
        throw new Error(response.message || 'Failed to fetch time slots');
      }
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setAvailableTimeSlots([]);
      // Show user-friendly error message
      setError(`Unable to load available time slots: ${handleAPIError(err)}`);
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  // Function to open edit modal
  const openEditModal = (appointment) => {
    setEditingAppointment(appointment);
    setEditFormData({
      subject: appointment.title || '',
      appointment_date: appointment.date || '',
      appointment_time: appointment.time ? appointment.time.split(' - ')[0] : '',
      appointment_type: appointment.type === 'Zoom Meeting' ? 'consultation' : 'phone_call'
    });
    setShowEditModal(true);
  };

  // Function to update appointment
  const updateAppointment = async () => {
    if (!editingAppointment || !editFormData.subject.trim()) {
      toast.error('Please fill in all required fields', {
        position: "top-right",
        autoClose: 3000,
        className: "custom-toast-success",
        bodyClassName: "custom-toast-body",
      });
      return;
    }

    try {
      setUpdatingAppointment(true);

      const updateData = {
        subject: editFormData.subject,
        appointment_type: editFormData.appointment_type
      };

      // Add date and time if they were changed
      if (editFormData.appointment_date) {
        updateData.appointment_date = editFormData.appointment_date;
      }
      if (editFormData.appointment_time) {
        updateData.appointment_time = editFormData.appointment_time;
      }

      const response = await appointmentsAPI.updateAppointment(editingAppointment.id, updateData);

      if (response.success) {
        toast.success('Appointment updated successfully!', {
          position: "top-right",
          autoClose: 3000,
          className: "custom-toast-success",
          bodyClassName: "custom-toast-body",
        });

        // Refresh appointments list
        await fetchAppointments();

        // Close modal after a short delay
        setTimeout(() => {
          setShowEditModal(false);
          setEditingAppointment(null);
        }, 1000);
      } else {
        throw new Error(response.message || 'Failed to update appointment');
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
      toast.error(handleAPIError(err) || 'Failed to update appointment', {
        position: "top-right",
        autoClose: 3000,
        className: "custom-toast-success",
        bodyClassName: "custom-toast-body",
      });
    } finally {
      setUpdatingAppointment(false);
    }
  };

  // Generate calendar days with proper month structure (Monday as first day)
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    // Get day of week (0 = Sunday, need to adjust for Monday = 0)
    let dayOfWeek = firstDay.getDay();
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0, Sunday = 6

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const days = [];
    const currentDay = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const dayNames = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  // Navigate month
  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      let newMonth = prev + direction;
      let newYear = currentYear;

      if (newMonth < 0) {
        newMonth = 11;
        newYear -= 1;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear += 1;
      }

      setCurrentYear(newYear);
      return newMonth;
    });
  };

  // Function to handle date selection and fetch time slots
  const handleDateSelection = async (date) => {
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    setSelectedCalendarDate(date);
    setSelectedDate(date.getDate());
    setSelectedTime(null); // Reset selected time when date changes
    setSelectedTimeSlot(null); // Reset selected time slot when date changes

    console.log('Date selected:', date.getDate(), 'Formatted date:', formattedDate, 'Admin ID:', selectedAdminId);

    // Call the time slots API
    await fetchTimeSlots(selectedAdminId, formattedDate);
  };

  // Get current timezone
  const getCurrentTimezone = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `Eastern Time - US & Canada (${timeString})`;
  };

  // Function to fetch available dates for a staff member
  const fetchAvailableDates = async (staffId) => {
    try {
      setLoadingAvailableDates(true);
      const response = await staffAPI.getAvailableDates(staffId);

      if (response.success && response.data && response.data.available_dates) {
        setAvailableDates(response.data.available_dates);
        console.log('Available dates loaded:', response.data.available_dates);
      } else {
        setAvailableDates([]);
      }
    } catch (err) {
      console.error('Error fetching available dates:', err);
      setAvailableDates([]);
    } finally {
      setLoadingAvailableDates(false);
    }
  };

  // Check if a date is available
  const isDateAvailable = (date) => {
    // If no dates loaded yet, don't allow any selection
    if (availableDates.length === 0) return false;

    // Format date as YYYY-MM-DD to match API response format
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    // Check if this date exists in the available dates array
    const isAvailable = availableDates.some(availDate => {
      // Ensure exact match with the date string
      return availDate.date === dateString;
    });

    // Debug log for troubleshooting
    if (isAvailable) {
      console.log(`Date ${dateString} is available`);
    }

    return isAvailable;
  };

  // Function to reset appointment creation form
  const resetAppointmentForm = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedTimeSlot(null);
    setSelectedBox(null);
    setFormData({ subject: '', description: '', appointment_with: 1, duration: '1 hour', timezone: 'eastern' });
    setAvailableTimeSlots([]);
    setSelectedCalendarDate(null);
    setAvailableDates([]);
    setCurrentMonth(new Date().getMonth());
    setCurrentYear(new Date().getFullYear());
  };

  // Load appointments and staff members on component mount
  useEffect(() => {
    fetchAppointments();
    fetchStaffMembers();
  }, []);

  return (
    <div className="px-4" >

      <div className="d-flex justify-content-between align-items-center mb-2">

        <div className="align-items-center mb-3 ">
          <h5
            className="mb-0 me-3"
            style={{
              color: "#3B4A66",
              fontSize: "28px",
              fontWeight: "500",
              fontFamily: "BasisGrotesquePro",
            }}
          >
            Appointments
          </h5>
          <p
            className="mb-0"
            style={{
              color: "#4B5563",
              fontSize: "14px",
              fontWeight: "400",
              fontFamily: "BasisGrotesquePro",
            }}
          >
            Schedule and manage your meetings
          </p>
        </div>

        <button
          className="btn d-flex align-items-center"
          style={{ background: "#F56D2D", color: "#fff" }}
          onClick={async () => {
            resetAppointmentForm();
            // Fetch staff members when opening appointment modal
            await fetchStaffMembers();
            setShowModal(true);
          }}
        >
          <FaPlus className="me-2" /> Schedule Appointment
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          <strong>Error:</strong> {error}
          <button
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={fetchAppointments}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading appointments...</span>
          </div>
          <span className="ms-2" style={{ fontFamily: "BasisGrotesquePro" }}>
            Loading appointments...
          </span>
        </div>
      )}

      {/* Stats - Only show when not loading */}
      {!loading && (
        <div className="d-flex gap-3 mb-4">
          <div className="bg-white rounded shadow-sm p-3 flex-grow-1">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }} >Next Appointment</small>
              <AppoinIcon style={{ width: "18px", height: "18px", color: "#3B4A66" }} />
            </div>
            {appointments.upcoming.length > 0 ? (
              <>
                <h6 className="mb-0 " style={{ fontFamily: "BasisGrotesquePro", color: "#3B4A66", fontSize: "14px", fontWeight: "500", }}>
                  {appointments.upcoming[0].date}
                </h6>
                <small style={{ fontFamily: "BasisGrotesquePro", color: "#3B4A66", fontSize: "14px", fontWeight: "400", }}>
                  {appointments.upcoming[0].time.split(' - ')[0]}
                </small>
              </>
            ) : (
              <>
                <h6 className="mb-0 " style={{ fontFamily: "BasisGrotesquePro", color: "#3B4A66", fontSize: "14px", fontWeight: "500", }}>
                  No upcoming
                </h6>
                <small style={{ fontFamily: "BasisGrotesquePro", color: "#3B4A66", fontSize: "14px", fontWeight: "400", }}>
                  appointments
                </small>
              </>
            )}
          </div>

          <div className="bg-white rounded shadow-sm p-3 flex-grow-1">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>This Month</small>
              <MonthIcon style={{ width: "18px", height: "18px", color: "#3B4A66" }} />
            </div>
            <h6 className="mb-0" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "14px", fontWeight: "400", }}>
              {appointments.upcoming.length + appointments.past.length}
            </h6>
            <small style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "14px", fontWeight: "400", }}>Appointments</small>
          </div>

          <div className="bg-white rounded shadow-sm p-3 flex-grow-1">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Total Hours</small>
              <AwaitingIcon style={{ width: "18px", height: "18px", color: "#3B4A66" }} />
            </div>
            <h6 className="mb-0" style={{ fontFamily: "BasisGrotesquePro", color: "#3B4A66", fontSize: "14px", fontWeight: "500", }}>
              {((appointments.upcoming.length + appointments.past.length) * 0.5).toFixed(1)}
            </h6>
            <small style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "14px", fontWeight: "400", }}>This month</small>
          </div>
        </div>
      )}


      {/* Appointment Lists - Only show when not loading */}
      {!loading && (
        <div className="d-flex gap-4 flex-wrap">

          <div className="bg-white rounded shadow-sm p-3 flex-grow-1" style={{ minWidth: "350px" }}>

            <div className="align-items-center mb-3 ">
              <h5
                className="mb-0 me-3"
                style={{
                  color: "#3B4A66",
                  fontSize: "20px",
                  fontWeight: "500",
                  fontFamily: "BasisGrotesquePro",
                }}
              >
                Upcoming Appointments
              </h5>
              <p
                className="mb-0"
                style={{
                  color: "#4B5563",
                  fontSize: "14px",
                  fontWeight: "400",
                  fontFamily: "BasisGrotesquePro",
                }}
              >
                Your Scheduled meetings
              </p>
            </div>

            {appointments.upcoming.length > 0 ? appointments.upcoming.map((appt) => (
              <div
                key={appt.id}
                className="border rounded p-3 mb-3 mt-3"
                onClick={() => setSelectedAppointmentId(appt.id)}
                style={{
                  cursor: "pointer",
                  backgroundColor: selectedAppointmentId === appt.id ? "#FFF4E6" : "white",
                }}
              >


                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center gap-2" style={{ fontFamily: "BasisGrotesquePro" }}>
                    <strong>{appt.title}</strong>


                    <span
                      className="px-1 py-1 fw-semibold"
                      style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        fontFamily: "BasisGrotesquePro",
                        backgroundColor:
                          appt.status === "Confirmed"
                            ? "#DCFCE7"
                            : appt.status === "Pending"
                              ? "#FEF9C3"
                              : "#E0E7FF",
                        borderRadius: "30px",
                        color:
                          appt.status === "Confirmed"
                            ? "#166534"
                            : appt.status === "Pending"
                              ? "#92400E"
                              : "#3730A3",
                      }}
                    >
                      {appt.status}
                    </span>

                  </div>

                  {/* Edit & Delete buttons */}
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn btn-sm"
                      style={{

                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(appt);
                      }}
                    >
                      <svg width="30" height="30" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0.25" y="0.25" width="25.5" height="25.5" rx="5.75" fill="white" />
                        <rect x="0.25" y="0.25" width="25.5" height="25.5" rx="5.75" stroke="#E8F0FF" stroke-width="0.5" />
                        <path d="M13 8.50011H9.5C9.23478 8.50011 8.98043 8.60547 8.79289 8.79301C8.60536 8.98054 8.5 9.2349 8.5 9.50011V16.5001C8.5 16.7653 8.60536 17.0197 8.79289 17.2072C8.98043 17.3948 9.23478 17.5001 9.5 17.5001H16.5C16.7652 17.5001 17.0196 17.3948 17.2071 17.2072C17.3946 17.0197 17.5 16.7653 17.5 16.5001V13.0001M16.1875 8.31261C16.3864 8.1137 16.6562 8.00195 16.9375 8.00195C17.2188 8.00195 17.4886 8.1137 17.6875 8.31261C17.8864 8.51153 17.9982 8.78131 17.9982 9.06261C17.9982 9.34392 17.8864 9.6137 17.6875 9.81261L13 14.5001L11 15.0001L11.5 13.0001L16.1875 8.31261Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </button>

                    <button
                      className="btn btn-sm ms-2"
                      style={{

                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelAppointment(appt.id);
                      }}
                    >
                      <svg width="30" height="30" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0.25" y="0.25" width="25.5" height="25.5" rx="5.75" fill="white" />
                        <rect x="0.25" y="0.25" width="25.5" height="25.5" rx="5.75" stroke="#E8F0FF" stroke-width="0.5" />
                        <path d="M8.5 10H17.5M16.5 10V17C16.5 17.5 16 18 15.5 18H10.5C10 18 9.5 17.5 9.5 17V10M11 10V9C11 8.5 11.5 8 12 8H14C14.5 8 15 8.5 15 9V10M12 12.5V15.5M14 12.5V15.5" stroke="#EF4444" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>

                    </button>

                  </div>
                </div>


                {/* Date, Time, Type in one line */}
                <div className="small text-muted d-flex align-items-center mb-2" style={{ gap: "15px", fontFamily: "BasisGrotesquePro" }}>
                  <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><DateIcon className="me-1 text-primary" /> {appt.date}</span>
                  <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><AwaitingIcon className="text-success" />{appt.time}</span>
                  <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><MobileIcon className="me-1 text-info" /> {appt.type}</span>
                </div>


                <div className="small text-muted d-flex align-items-center" style={{ gap: "15px", fontFamily: "BasisGrotesquePro" }}>
                  <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><PersonIcon className="me-1 text-primary" />{appt.person}</span>
                  <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><DiscusIcon className="me-1 text-primary" />{appt.description}</span>
                </div>

                {/* Join button if available */}
                {appt.joinable && (
                  <button
                    className="btn w-100 mt-3"
                    style={{ background: "#F56D2D", color: "#fff" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (appt.zoom_link) {
                        window.open(appt.zoom_link, '_blank');
                      }
                    }}
                  >
                    <BsCameraVideo className="me-2" /> Join Meeting
                  </button>
                )}
              </div>
            )) : (
              <div className="text-center py-4">
                <p style={{ color: "#6B7280", fontFamily: "BasisGrotesquePro" }}>
                  No upcoming appointments scheduled
                </p>
              </div>
            )}
          </div>


          {/* Past */}
          <div className="bg-white rounded shadow-sm p-3 flex-grow-1" style={{ minWidth: "350px" }}>

            <div className="align-items-center mb-3 ">
              <h5
                className="mb-0 me-3"
                style={{
                  color: "#3B4A66",
                  fontSize: "20px",
                  fontWeight: "500",
                  fontFamily: "BasisGrotesquePro",
                }}
              >
                Past Appointments
              </h5>
              <p
                className="mb-0"
                style={{
                  color: "#4B5563",
                  fontSize: "14px",
                  fontWeight: "400",
                  fontFamily: "BasisGrotesquePro",
                }}
              >
                Your Scheduled meetings
              </p>
            </div>


            {appointments.past.length > 0 ? appointments.past.map((appt) => (
              <div
                key={appt.id}
                className="border rounded p-3 mb-3 mt-3"
                onClick={() => setSelectedAppointmentId(appt.id)}
                style={{
                  cursor: "pointer",
                  backgroundColor: selectedAppointmentId === appt.id ? "#FFF4E6" : "white",
                }}
              >


                <div className="d-flex align-items-center gap-2 mb-2">
                  <strong>{appt.title}</strong>
                  <span
                    className="px-2 py-1 small fw-semibold"
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      backgroundColor:
                        appt.status === "Completed"
                          ? "#DCFCE7"
                          : appt.status === "Cancelled"
                            ? "#FEE2E2"
                            : "#E0E7FF",
                      borderRadius: "30px",
                      color:
                        appt.status === "Completed"
                          ? "#166534"
                          : appt.status === "Cancelled"
                            ? "#991B1B"
                            : "#3730A3",
                    }}
                  >
                    {appt.status}
                  </span>
                </div>


                <div className="small text-muted d-flex align-items-center mb-2" style={{ gap: "15px", fontFamily: "BasisGrotesquePro" }}>
                  <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><DateIcon className="me-1 text-primary" /> {appt.date}</span>
                  <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><AwaitingIcon className="text-success" />{appt.time}</span>
                  <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><MobileIcon className="me-1 text-info" /> {appt.type}</span>
                </div>


                <div className="small text-muted d-flex align-items-center" style={{ gap: "15px", fontFamily: "BasisGrotesquePro" }}>
                  <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><PersonIcon className="me-1 text-primary" />{appt.person}</span>
                  <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><DiscusIcon className="me-1 text-primary" />{appt.description}</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-4">
                <p style={{ color: "#6B7280", fontFamily: "BasisGrotesquePro" }}>
                  No past appointments
                </p>
              </div>
            )}
          </div>

        </div>
      )}




      {/* ---------- Custom Modal Popup ---------- */}
      {showModal && (
        <div
          className="custom-popup-overlay"
          onClick={(e) => {
            // Close modal if clicking on overlay (outside the container)
            if (e.target === e.currentTarget) {
              resetAppointmentForm();
              setShowModal(false);
            }
          }}
        >
          <div className="custom-popup-container" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="popup-header">
              <div className="popup-header-top">
                <h5 className="popup-title">Schedule New Appointment</h5>
                <button onClick={() => {
                  resetAppointmentForm();
                  setShowModal(false);
                }} className="popup-close-btn">
                  <CrossIcon />
                </button>
              </div>
              <div
                style={{
                  borderBottom: "1px solid #E5E7EB",
                  paddingBottom: "16px",
                  marginTop: "2px",
                  position: "relative"
                }}
              >
                <p
                  className="popup-subtitle"
                  style={{
                    marginBottom: "0",
                    marginRight: "40px"
                  }}
                >
                  Schedule a meeting with your tax professional
                </p>
              </div>
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <div className="popup-body">
                {/* Staff Error Message - Show prominently if staff couldn't be loaded */}
                {staffError && staffError.includes('associated with a firm') && (
                  <div className="alert alert-warning mb-3" role="alert" style={{
                    backgroundColor: "#FEF3C7",
                    border: "1px solid #F59E0B",
                    color: "#92400E",
                    fontFamily: "BasisGrotesquePro",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    marginBottom: "16px"
                  }}>
                    <strong style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <svg width="20" height="20" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_584_1462)">
                          <path d="M4.99992 3.33301V4.99968M9.16659 4.99968C9.16659 7.30086 7.30111 9.16634 4.99992 9.16634C2.69873 9.16634 0.833252 7.30086 0.833252 4.99968C0.833252 2.69849 2.69873 0.833008 4.99992 0.833008C7.30111 0.833008 9.16659 2.69849 9.16659 4.99968Z" stroke="#F56D2D" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M5 6.66699H5.01042" stroke="#F56D2D" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                        <defs>
                          <clipPath id="clip0_584_1462">
                            <rect width="10" height="10" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                      Firm Association Required
                    </strong>
                    <small>{staffError}</small>
                  </div>
                )}

                {/* Only show appointment options if there's no firm association error */}
                {!(staffError && staffError.includes('associated with a firm')) && (
                  <>
                    {(selectedBox
                      ? [
                        {
                          id: selectedBox,
                          ...{
                            id: 1,
                            icon: <span className="icon-custom"><ZoomIcon /></span>,
                            title: `Schedule a free Zoom call with ${staffMembers.find(s => s.id === selectedAdminId)?.name || 'Tax Professional'}`,
                            // desc: "Use this to schedule 1 hour long zoom meeting",
                          },
                        },
                      ]
                      : [
                        {
                          id: 1,
                          icon: <span className="icon-custom"><ZoomIcon /></span>,
                          title: `Schedule a free Zoom call with ${staffMembers.find(s => s.id === selectedAdminId)?.name || 'Tax Professional'}`,
                          // desc: "Use this to schedule 1 hour long zoom meeting",
                        },
                      ]
                    ).map((option) => (
                      <div key={option.id} className="option-box">
                        <div
                          onClick={async () => {
                            // Toggle selection when clicking anywhere on the option box
                            if (selectedBox === option.id) {
                              setSelectedBox(null);
                              setSelectedDate(null);
                              setSelectedTime(null);
                              setSelectedTimeSlot(null);
                              setAvailableTimeSlots([]);
                              setSelectedCalendarDate(null);
                              setAvailableDates([]);
                            } else {
                              setSelectedBox(option.id);
                              setHighlightBox(option.id);
                              // Fetch available dates for the selected staff member
                              await fetchAvailableDates(selectedAdminId);
                            }
                          }}
                          className={`info ${selectedBox === option.id ? "active" : ""} ${highlightBox === option.id ? "highlighted" : ""}`}
                          style={{
                            cursor: "pointer",
                            transition: "all 0.3s ease"
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex gap-2 align-items-start">
                              <span>{option.icon}</span>
                              <div>
                                <strong className="option-title">{option.title}</strong>
                                {option.desc && <p className="option-desc">{option.desc}</p>}
                              </div>
                            </div>

                            {selectedBox !== option.id && (
                              <span
                                className="arrow-icon"
                                style={{
                                  fontSize: "20px",
                                  color: "#3B4A66",
                                  transition: "transform 0.3s ease"
                                }}
                              >
                                ›
                              </span>
                            )}
                            {selectedBox === option.id && (
                              <span
                                className="arrow-icon"
                                style={{
                                  fontSize: "20px",
                                  color: "#3B4A66",
                                  transform: "rotate(90deg)",
                                  transition: "transform 0.3s ease"
                                }}
                              >
                                ›
                              </span>
                            )}
                          </div>

                          {selectedBox === option.id && (
                            <div className="mt-1" style={{
                              animation: "fadeIn 0.3s ease",
                              overflow: "hidden"
                            }}>
                              {/* <button className="btn schedule-btn d-flex align-items-center gap-2">
                                <span className="d-flex align-items-center small-icon">
                                  <AwaitingIcon className="text-success" />
                                </span>
                                <span className="schedule-time">1 hour</span>
                              </button> */}
                            </div>
                          )}
                        </div>

                        {selectedBox === option.id && (
                          <div style={{
                            maxHeight: "1000px",
                            overflow: "hidden",
                            animation: "slideDown 0.3s ease",
                            transition: "all 0.3s ease"
                          }}>
                            <div className="selection-box">
                              <div className="row">
                                <div className="col-7">
                                  <h6 className="selection-title">Select a date</h6>

                                  {/* Month/Year Navigation */}
                                  <div className="d-flex justify-content-between align-items-center mb-2" style={{
                                    fontFamily: "BasisGrotesquePro",
                                    color: "#6B7280",
                                    fontSize: "14px"
                                  }}>
                                    <span>{monthNames[currentMonth]} {currentYear}</span>
                                    <div className="d-flex align-items-center gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigateMonth(-1);
                                        }}
                                        style={{
                                          border: "none",
                                          background: "transparent",
                                          cursor: "pointer",
                                          fontSize: "16px",
                                          color: "#374151",
                                          padding: "4px 8px"
                                        }}
                                      >
                                        &lt;
                                      </button>
                                      <span style={{ minWidth: "50px", textAlign: "center" }}>
                                        {monthNamesShort[currentMonth]}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigateMonth(1);
                                        }}
                                        style={{
                                          border: "none",
                                          background: "transparent",
                                          cursor: "pointer",
                                          fontSize: "16px",
                                          color: "#374151",
                                          padding: "4px 8px"
                                        }}
                                      >
                                        &gt;
                                      </button>
                                    </div>
                                  </div>

                                  {/* Days of Week Header */}
                                  <div className="d-flex mb-2" style={{
                                    borderBottom: "1px solid #E5E7EB",
                                    paddingBottom: "8px"
                                  }}>
                                    {dayNames.map((day) => (
                                      <div
                                        key={day}
                                        style={{
                                          flex: 1,
                                          textAlign: "center",
                                          fontSize: "12px",
                                          color: "#6B7280",
                                          fontFamily: "BasisGrotesquePro",
                                          fontWeight: 400
                                        }}
                                      >
                                        {day}
                                      </div>
                                    ))}
                                  </div>

                                  {/* Calendar Grid */}
                                  <div className="calendar-grid">
                                    {loadingAvailableDates && (
                                      <div className="d-flex justify-content-center align-items-center" style={{
                                        gridColumn: "1 / -1",
                                        padding: "20px",
                                        fontSize: "13px",
                                        color: "#6B7280",
                                        fontFamily: "BasisGrotesquePro"
                                      }}>
                                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                                        Loading available dates...
                                      </div>
                                    )}
                                    {!loadingAvailableDates && generateCalendarDays().map((date, index) => {
                                      const isCurrentMonth = date.getMonth() === currentMonth;
                                      const isSelected = selectedCalendarDate &&
                                        date.toDateString() === selectedCalendarDate.toDateString();
                                      const isAvailable = isDateAvailable(date);

                                      // Only block past dates, allow all future available dates regardless of month
                                      const today = new Date();
                                      today.setHours(0, 0, 0, 0);
                                      const dateToCheck = new Date(date);
                                      dateToCheck.setHours(0, 0, 0, 0);
                                      const isPast = dateToCheck < today;

                                      // Make all available dates clickable (from any month if available)
                                      const canSelect = isAvailable && !isPast;

                                      return (
                                        <button
                                          key={index}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (canSelect) {
                                              handleDateSelection(date);
                                            }
                                          }}
                                          className={`calendar-btn ${isSelected ? "active" : ""}`}
                                          disabled={!canSelect}
                                          style={{
                                            color: isCurrentMonth
                                              ? (canSelect ? "#374151" : "#9CA3AF")
                                              : (canSelect ? "#374151" : "#9CA3AF"),
                                            fontWeight: isCurrentMonth ? 400 : 300,
                                            opacity: canSelect ? 1 : 0.4,
                                            cursor: canSelect ? 'pointer' : 'not-allowed',
                                            backgroundColor: isSelected ? '#FF6600' : 'transparent'
                                          }}
                                        >
                                          {date.getDate()}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="col-5">
                                  <h6 className="selection-title">
                                    Select a time
                                    {loadingTimeSlots && (
                                      <span className="ms-2">
                                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                                          <span className="visually-hidden">Loading...</span>
                                        </div>
                                      </span>
                                    )}
                                  </h6>

                                  {/* Duration */}
                                  {/* <div style={{
                                    fontSize: "13px",
                                    color: "#6B7280",
                                    fontFamily: "BasisGrotesquePro",
                                    marginBottom: "12px"
                                  }}>
                                    Duration: 1 hour
                                  </div> */}

                                  {/* Timezone Selector */}
                                  <div className="mb-3">
                                    <select
                                      className="form-select"
                                      value={formData.timezone || 'eastern'}
                                      onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                                      style={{
                                        fontSize: "12px",
                                        fontFamily: "BasisGrotesquePro",
                                        color: "#374151",
                                        border: "1px solid #E5E7EB",
                                        borderRadius: "30px",
                                        padding: "8px 35px 8px 12px",
                                        backgroundColor: "var(--Palette2-Dark-blue-100, #E8F0FF)",
                                        cursor: "pointer",
                                        appearance: "none",
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
                                        backgroundRepeat: "no-repeat",
                                        backgroundPosition: "right 12px center",
                                        backgroundSize: "16px 12px"
                                      }}
                                    >
                                      <option value="eastern">Eastern Time - US & Canada (EST/EDT)</option>
                                      <option value="central">Central Time - US & Canada (CST/CDT)</option>
                                      <option value="mountain">Mountain Time - US & Canada (MST/MDT)</option>
                                      <option value="pacific">Pacific Time - US & Canada (PST/PDT)</option>
                                      <option value="alaska">Alaska Time (AKST/AKDT)</option>
                                      <option value="hawaii">Hawaii Time (HST)</option>
                                      <option value="utc">UTC (Coordinated Universal Time)</option>
                                    </select>
                                  </div>

                                  <div className={`time-list ${selectedTime ? "clicked" : ""}`}>
                                    {loadingTimeSlots ? (
                                      <div className="text-center py-3">
                                        <div className="spinner-border text-primary mb-2" role="status">
                                          <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <div>
                                          <small>Loading available times for selected date...</small>
                                        </div>
                                      </div>
                                    ) : availableTimeSlots.length > 0 ? (
                                      availableTimeSlots.map((slot, index) => {
                                        // Use start_time_display which is extracted from formatted_time
                                        const timeDisplay = slot.start_time_display || slot.start_time;

                                        return (
                                          <button
                                            key={slot.start_time || index}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (slot.is_available && !slot.is_booked) {
                                                setSelectedTime(timeDisplay);
                                                setSelectedTimeSlot(slot); // Store the full slot object
                                              }
                                            }}
                                            className={`time-btn ${selectedTime === timeDisplay ? "active" : ""} ${!(slot.is_available && !slot.is_booked) ? "disabled" : ""}`}
                                            disabled={!(slot.is_available && !slot.is_booked)}
                                            style={{
                                              opacity: (slot.is_available && !slot.is_booked) ? 1 : 0.5,
                                              cursor: (slot.is_available && !slot.is_booked) ? 'pointer' : 'not-allowed'
                                            }}
                                          >
                                            {timeDisplay}
                                            {slot.is_booked && <small className="d-block">Booked</small>}
                                          </button>
                                        );
                                      })
                                    ) : selectedDate ? (
                                      <div className="text-center py-2">
                                        <small>No available time slots for this date</small>
                                      </div>
                                    ) : (
                                      <div className="text-center py-2">
                                        <small>Please select a date to see available times</small>
                                      </div>
                                    )}
                                  </div>

                                </div>
                              </div>
                            </div>

                            <div className="d-flex justify-content-between mt-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBox(null);
                                  setSelectedDate(null);
                                  setSelectedTime(null);
                                  setSelectedTimeSlot(null);
                                  setAvailableTimeSlots([]);
                                  setSelectedCalendarDate(null);
                                }}
                                style={{
                                  background: "#ffffff",
                                  border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                                  padding: "8px 16px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontFamily: "BasisGrotesquePro",
                                }}
                              >
                                Back
                              </button>
                              <button
                                disabled={!selectedDate || !selectedTime}
                                onClick={() => setStep(2)}
                                className="nex-btn"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}


            {/* Step 2 : Subject of Meeting */}
            {step === 2 && (
              <div style={{ padding: "20px" }}>
                {/* Staff Error Message - Show prominently if staff couldn't be loaded */}
                {staffError && staffError.includes('associated with a firm') && (
                  <div className="alert alert-warning mb-3" role="alert" style={{
                    backgroundColor: "#FEF3C7",
                    border: "1px solid #F59E0B",
                    color: "#92400E",
                    fontFamily: "BasisGrotesquePro",
                    borderRadius: "8px",
                    padding: "12px 16px"
                  }}>
                    <strong style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_584_1462_step2)">
                          <path d="M4.99992 3.33301V4.99968M9.16659 4.99968C9.16659 7.30086 7.30111 9.16634 4.99992 9.16634C2.69873 9.16634 0.833252 7.30086 0.833252 4.99968C0.833252 2.69849 2.69873 0.833008 4.99992 0.833008C7.30111 0.833008 9.16659 2.69849 9.16659 4.99968Z" stroke="#F56D2D" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M5 6.66699H5.01042" stroke="#F56D2D" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                        <defs>
                          <clipPath id="clip0_584_1462_step2">
                            <rect width="10" height="10" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                      Firm Association Required
                    </strong>
                    <small>{staffError}</small>
                  </div>
                )}

                {/* Error Message */}
                {createError && (
                  <div className="alert alert-danger mb-3" role="alert">
                    <strong>Error:</strong> {createError}
                  </div>
                )}

                {/* Success Message */}
                {createSuccess && (
                  <div className="alert alert-success mb-3" role="alert">
                    <strong>Success:</strong> Appointment created successfully!
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                  }}
                >
                  {/* LEFT CARD : Schedule Details */}
                  <div
                    style={{
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      padding: "15px",
                      background: "#fff",
                      fontFamily: "BasisGrotesquePro"
                    }}
                  >
                    {/* Selected Appointment Info */}
                    {[
                      {
                        id: 1,
                        icon: <span className="icon-custom"><ZoomIcon /></span>,
                        title: `Schedule a free Zoom call with ${staffMembers.find(s => s.id === selectedAdminId)?.name || 'Tax Professional'}`,
                      },
                    ]
                      .filter((opt) => opt.id === selectedBox)
                      .map((selectedOpt) => (
                        <div key={selectedOpt.id} style={{ fontFamily: "BasisGrotesquePro" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                            <span>{selectedOpt.icon}</span>
                            <div>
                              <h6
                                style={{
                                  fontSize: "14px",
                                  fontWeight: "500",
                                  fontFamily: "BasisGrotesquePro",
                                  marginBottom: "4px",
                                  color: "#3B4A66",
                                }}
                              >
                                {selectedOpt.title}
                              </h6>
                              <p
                                style={{
                                  fontSize: "13px",
                                  fontFamily: "BasisGrotesquePro",
                                  color: "#4B5563",
                                  marginBottom: "10px",
                                  paddingBottom: "10px",
                                  fontWeight: "400",
                                  borderBottom: "0.5px solid var(--Palette2-Dark-blue-600, #4B5563)"
                                }}
                              >
                                {(() => {
                                  // Calculate duration from selected time slot
                                  if (selectedTimeSlot && selectedTimeSlot.start_time && selectedTimeSlot.end_time) {
                                    const start = new Date(`2000-01-01 ${selectedTimeSlot.start_time}`);
                                    const end = new Date(`2000-01-01 ${selectedTimeSlot.end_time}`);
                                    const diffMs = end - start;
                                    const diffMinutes = diffMs / (1000 * 60);

                                    if (diffMinutes === 30) {
                                      return 'Use this to schedule 30 minute phone call meeting';
                                    } else if (diffMinutes === 60) {
                                      return 'Use this to schedule 1 hour long zoom meeting';
                                    } else if (diffMinutes === 90) {
                                      return 'Use this to schedule 1.5 hour long zoom meeting';
                                    } else if (diffMinutes === 120) {
                                      return 'Use this to schedule 2 hour long zoom meeting';
                                    } else {
                                      return `Use this to schedule ${diffMinutes} minute meeting`;
                                    }
                                  }
                                  return 'Use this to schedule 30 minute phone call meeting';
                                })()}
                              </p>
                              <button
                                style={{
                                  background: "#E8F0FF",
                                  color: "#374151",
                                  padding: "7px 14px",
                                  borderRadius: "12px",
                                  border: "none",
                                  cursor: "pointer",
                                  fontSize: "14px",
                                  fontWeight: "500",
                                  fontFamily: "BasisGrotesquePro",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <span className="d-flex align-items-center small-icon"><AwaitingIcon className="text-success" /></span>
                                <span style={{ fontSize: "15px", color: "#4B5563", fontWeight: "400" }}>
                                  {(() => {
                                    // Calculate duration from selected time slot
                                    if (selectedTimeSlot && selectedTimeSlot.start_time && selectedTimeSlot.end_time) {
                                      const start = new Date(`2000-01-01 ${selectedTimeSlot.start_time}`);
                                      const end = new Date(`2000-01-01 ${selectedTimeSlot.end_time}`);
                                      const diffMs = end - start;
                                      const diffMinutes = diffMs / (1000 * 60);

                                      if (diffMinutes === 30) {
                                        return '30 minutes';
                                      } else if (diffMinutes === 60) {
                                        return '1 hour';
                                      } else if (diffMinutes === 90) {
                                        return '1.5 hours';
                                      } else if (diffMinutes === 120) {
                                        return '2 hours';
                                      } else {
                                        return `${diffMinutes} minutes`;
                                      }
                                    }
                                    return '1 hour';
                                  })()}
                                </span>
                              </button>
                            </div>
                          </div>


                          <div
                            style={{
                              marginTop: "15px",
                              fontFamily: "BasisGrotesquePro",
                              marginLeft: "20px",
                            }}
                          >

                            <p
                              style={{
                                fontSize: "13px",
                                margin: "6px 0",
                                color: "#6B7280",
                                fontFamily: "BasisGrotesquePro",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <span className="d-flex align-items-center small-icon"><DateIcon /></span>
                              {selectedTimeSlot && selectedTimeSlot.formatted_time && selectedCalendarDate
                                ? `${selectedTimeSlot.formatted_time}, ${monthNames[selectedCalendarDate.getMonth()]} ${selectedCalendarDate.getDate()}, ${selectedCalendarDate.getFullYear()}`
                                : selectedCalendarDate && selectedTime
                                  ? `${selectedTime}, ${monthNames[selectedCalendarDate.getMonth()]} ${selectedCalendarDate.getDate()}, ${selectedCalendarDate.getFullYear()}`
                                  : selectedDate && selectedTime
                                    ? `${selectedTime}, ${selectedDate} ${monthNames[new Date().getMonth()]} ${new Date().getFullYear()}`
                                    : 'No date selected'}
                            </p>


                            <p
                              style={{
                                fontSize: "13px",
                                margin: "4px 0",
                                color: "#6B7280",
                                fontFamily: "BasisGrotesquePro",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <EsternTimeIcon />
                              {getCurrentTimezone()}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div
                    style={{
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      padding: "15px",
                      background: "#fff",
                      width: "100%",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >


                    <h6
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#3B4A66",
                        fontFamily: "BasisGrotesquePro",
                        marginBottom: "10px",
                      }}
                    >
                      Subject of Meeting
                    </h6>
                    <textarea
                      placeholder="write the subject that will help in meeting preparation (e.g., Intake, Review, Audit Support, etc.)"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      style={{
                        width: "100%",
                        minHeight: "80px",
                        border: "1px solid #E5E7EB",
                        borderRadius: "6px",
                        padding: "8px",
                        fontSize: "13px",
                        fontFamily: "BasisGrotesquePro",
                        marginBottom: "15px"
                      }}
                    ></textarea>
                  </div>
                </div>

                {/* Description Section - Below the grid */}
                <div
                  style={{
                    marginTop: "20px",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    padding: "15px",
                    background: "#fff",
                    fontFamily: "BasisGrotesquePro",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  <h6
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#3B4A66",
                      fontFamily: "BasisGrotesquePro",
                      marginBottom: "10px",
                    }}
                  >
                    Description
                  </h6>
                  <textarea
                    placeholder="Discuss Q1 2024 tax planning strategies"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    style={{
                      width: "100%",
                      minHeight: "100px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px",
                      padding: "8px",
                      fontSize: "13px",
                      fontFamily: "BasisGrotesquePro",
                    }}
                  ></textarea>
                </div>

                <div
                  style={{
                    marginTop: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <button
                    onClick={() => setStep(1)}
                    style={{
                      background: "#ffffff",
                      border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontFamily: "BasisGrotesquePro",
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={createAppointment}
                    disabled={creatingAppointment || !selectedDate || !selectedTime || !formData.subject.trim()}
                    style={{
                      background: creatingAppointment ? "#ccc" : "#F56D2D",
                      color: "#fff",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: creatingAppointment ? "not-allowed" : "pointer",
                      fontFamily: "BasisGrotesquePro",
                    }}
                  >
                    {creatingAppointment ? 'Creating...' : 'Submit'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )
      }

      {/* Edit Appointment Modal */}
      {
        showEditModal && editingAppointment && (
          <div
            className="custom-popup-overlay"
            onClick={(e) => {
              // Close modal if clicking on overlay (outside the container)
              if (e.target === e.currentTarget) {
                setShowEditModal(false);
                setEditingAppointment(null);
              }
            }}
          >
            <div className="custom-popup-container" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="popup-header">
                <div className="popup-header-top">
                  <h5 className="popup-title">Edit Appointment</h5>
                  <button onClick={() => setShowEditModal(false)} className="popup-close-btn">
                    <CrossIcon />
                  </button>
                </div>
                <p className="popup-subtitle">Update your appointment details</p>
              </div>

              {/* Edit Form */}
              <div style={{ padding: "20px" }}>

                <div className="mb-3">
                  <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500" }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFormData.subject}
                    onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                    placeholder="Enter appointment subject"
                    style={{ fontFamily: "BasisGrotesquePro" }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500" }}>
                    Appointment Type
                  </label>
                  <select
                    className="form-select"
                    value={editFormData.appointment_type}
                    onChange={(e) => setEditFormData({ ...editFormData, appointment_type: e.target.value })}
                    style={{ fontFamily: "BasisGrotesquePro" }}
                  >
                    <option value="consultation">Consultation</option>
                    <option value="phone_call">Phone Call</option>
                    <option value="review">Review</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500" }}>
                    Date (Optional)
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={editFormData.appointment_date}
                    onChange={(e) => setEditFormData({ ...editFormData, appointment_date: e.target.value })}
                    style={{ fontFamily: "BasisGrotesquePro" }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500" }}>
                    Time (Optional)
                  </label>
                  <input
                    type="time"
                    className="form-control"
                    value={editFormData.appointment_time}
                    onChange={(e) => setEditFormData({ ...editFormData, appointment_time: e.target.value })}
                    style={{ fontFamily: "BasisGrotesquePro" }}
                  />
                </div>

                <div className="d-flex justify-content-between">
                  <button
                    onClick={() => setShowEditModal(false)}
                    disabled={updatingAppointment}
                    style={{
                      background: "#ffffff",
                      border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: updatingAppointment ? "not-allowed" : "pointer",
                      fontFamily: "BasisGrotesquePro",
                      opacity: updatingAppointment ? 0.6 : 1
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateAppointment}
                    className="btn"
                    style={{ background: "#F56D2D", color: "#fff" }}
                    disabled={updatingAppointment}
                  >
                    {updatingAppointment ? 'Updating...' : 'Update Appointment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
