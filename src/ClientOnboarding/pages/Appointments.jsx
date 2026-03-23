import React, { useState, useEffect, useRef } from "react";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { FaPlus } from "react-icons/fa";
import { BsCameraVideo } from "react-icons/bs";
import { toast } from "react-toastify";
import { DateIcon, AwaitingIcon, MobileIcon, PersonIcon, DiscusIcon, EditIcon, DeleteIcon, AppoinIcon, MonthIcon, ZoomIcon, EsternTimeIcon, CrossIcon } from "../components/icons";
import { appointmentsAPI, adminAvailabilityAPI, timeSlotsAPI, staffAPI, handleAPIError } from "../utils/apiUtils";
import { getApiBaseUrl, fetchWithCors } from "../utils/corsConfig";
import { getAccessToken } from "../utils/userUtils";
import Pagination from "../components/Pagination";
import ConfirmationModal from "../../components/ConfirmationModal";
import "../styles/Icon.css"
import "../styles/fonts.css"
import "../styles/Appointment.css";
import ScheduleAppointmentModal from "../components/ScheduleAppointmentModal";

export default function Appointments() {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const times = [
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
  ]

  // API state management
  const [appointments, setAppointments] = useState({
    upcoming: [],
    past: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Appointment editing state
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updatingAppointment, setUpdatingAppointment] = useState(false);
  const [editFormData, setEditFormData] = useState({
    subject: '',
    appointment_date: '',
    appointment_time: '',
    meeting_type: 'zoom'
  });

  // Edit modal time slots state
  const [editModalTimeSlots, setEditModalTimeSlots] = useState([]);
  const [loadingEditTimeSlots, setLoadingEditTimeSlots] = useState(false);

  // Track current time to re-evaluate join button visibility
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60 * 1000); // refresh every minute

    return () => clearInterval(intervalId);
  }, []);

  // Pagination state
  const [upcomingCurrentPage, setUpcomingCurrentPage] = useState(1);
  const [pastCurrentPage, setPastCurrentPage] = useState(1);
  const itemsPerPage = 3;

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

      // Get meeting link (check multiple possible fields)
      const meetingLink = appointment.zoom_meeting_link || appointment.zoom_link ||
        appointment.google_meet_link || appointment.meeting_link;

      // Determine if appointment is upcoming (considering date and time)
      const isUpcoming = startTime >= now;

      // Determine meeting type display
      let meetingTypeDisplay = 'Phone Call';
      if (appointment.meeting_type === 'zoom') {
        meetingTypeDisplay = 'Zoom Meeting';
      } else if (appointment.meeting_type === 'google_meet') {
        meetingTypeDisplay = 'Google Meet';
      } else if (appointment.meeting_type === 'in_person') {
        meetingTypeDisplay = 'In Person';
      } else if (appointment.meeting_type === 'on_call') {
        meetingTypeDisplay = 'Phone Call';
      } else if (appointment.appointment_type === 'consultation') {
        meetingTypeDisplay = 'Zoom Meeting';
      }

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
        type: meetingTypeDisplay,
        meeting_link: meetingLink,
        zoom_link: appointment.zoom_link || appointment.zoom_meeting_link,
        google_meet_link: appointment.google_meet_link,
        meeting_type: appointment.meeting_type,
        admin_email: appointment.admin_email,
        client_name: appointment.client_name,
        client_email: appointment.client_email,
        created_at: appointment.created_at,
        updated_at: appointment.updated_at,
        appointment_date_time: startTime, // Store start datetime for comparison
        appointment_end_time: endTime
      };

      if (isUpcoming) {
        upcoming.push(formattedAppointment);
      } else {
        past.push(formattedAppointment);
      }
    });

    // Sort upcoming by datetime (earliest first)
    upcoming.sort((a, b) => a.appointment_date_time - b.appointment_date_time);
    // Sort past by datetime (most recent first)
    past.sort((a, b) => b.appointment_date_time - a.appointment_date_time);

    return { upcoming, past };
  };

  const canJoinAppointment = (appointment) => {
    if (!appointment || !appointment.meeting_link || !appointment.appointment_date_time) {
      return false;
    }

    const startTime = new Date(appointment.appointment_date_time);
    const endTime = appointment.appointment_end_time
      ? new Date(appointment.appointment_end_time)
      : new Date(startTime.getTime() + 30 * 60 * 1000);

    const joinWindowStart = new Date(startTime.getTime() - 10 * 60 * 1000);
    const now = new Date(currentTime);

    return now >= joinWindowStart && now <= endTime;
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

  // Removed fetchStaffMembers as it is now in the modal component

  // Removed createAppointment as it is now in the modal component

  const [showCancelAppointmentConfirm, setShowCancelAppointmentConfirm] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  // Function to cancel appointment
  const cancelAppointment = async (appointmentId) => {
    setAppointmentToCancel(appointmentId);
    setShowCancelAppointmentConfirm(true);
  };

  const confirmCancelAppointment = async () => {
    if (!appointmentToCancel) return;

    try {
      const response = await appointmentsAPI.deleteAppointment(appointmentToCancel);

      if (response.success) {
        // Refresh appointments list
        await fetchAppointments();
        toast.success('Appointment cancelled successfully', {
          position: "top-right",
          autoClose: 3000,
          className: "custom-toast-success",
          bodyClassName: "custom-toast-body",
        });
        setShowCancelAppointmentConfirm(false);
        setAppointmentToCancel(null);
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
        icon: false,
      });
    }
  };

  // Removed fetchTimeSlots as it is now in the modal component

  // Fetch available time slots for edit modal
  const fetchEditModalTimeSlots = async (date) => {
    if (!date) {
      setEditModalTimeSlots([]);
      return;
    }

    try {
      setLoadingEditTimeSlots(true);
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${API_BASE_URL}/taxpayer/tax-preparer/availability/slots/?date=${date}`;

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

      if (result.success && result.data && result.data.available_slots) {
        setEditModalTimeSlots(result.data.available_slots);
      } else {
        setEditModalTimeSlots([]);
      }
    } catch (error) {
      console.error('Error fetching edit modal time slots:', error);
      setEditModalTimeSlots([]);
      toast.error('Failed to load available time slots', {
        position: "top-right",
        autoClose: 3000,
        className: "custom-toast-success",
        bodyClassName: "custom-toast-body",
        icon: false,
      });
    } finally {
      setLoadingEditTimeSlots(false);
    }
  };

  // Function to open edit modal
  const openEditModal = (appointment) => {
    setEditingAppointment(appointment);
    // Convert date to YYYY-MM-DD format for date input
    let appointmentDate = '';
    if (appointment.date) {
      try {
        // If date is in format like "Mar 6, 2024", convert it
        const dateObj = new Date(appointment.date);
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          appointmentDate = `${year}-${month}-${day}`;
        } else {
          // If already in YYYY-MM-DD format, use as is
          appointmentDate = appointment.date;
        }
      } catch (error) {
        appointmentDate = appointment.date;
      }
    }

    // Map appointment type to meeting_type
    let meetingType = 'zoom'; // default
    if (appointment.type === 'Zoom Meeting') {
      meetingType = 'zoom';
    } else if (appointment.type === 'Google Meet') {
      meetingType = 'google_meet';
    } else if (appointment.type === 'Phone Call') {
      meetingType = 'on_call';
    } else if (appointment.type === 'In Person') {
      meetingType = 'in_person';
    }

    setEditFormData({
      subject: appointment.title || '',
      appointment_date: appointmentDate,
      appointment_time: appointment.time ? appointment.time.split(' - ')[0] : '',
      meeting_type: meetingType
    });
    setEditModalTimeSlots([]);
    setShowEditModal(true);

    // Fetch time slots if date exists
    if (appointmentDate) {
      fetchEditModalTimeSlots(appointmentDate);
    }
  };

  // Function to update appointment
  const updateAppointment = async () => {
    if (!editingAppointment || !editFormData.subject.trim()) {
      toast.error('Please fill in all required fields', {
        position: "top-right",
        autoClose: 3000,
        className: "custom-toast-success",
        bodyClassName: "custom-toast-body",
        icon: false,
      });
      return;
    }

    try {
      setUpdatingAppointment(true);

      const updateData = {
        subject: editFormData.subject,
        meeting_type: editFormData.meeting_type
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
        icon: false,
      });
    } finally {
      setUpdatingAppointment(false);
    }
  };

  // Load appointments on component mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Reset pagination when appointments change
  useEffect(() => {
    setUpcomingCurrentPage(1);
  }, [appointments.upcoming.length]);

  useEffect(() => {
    setPastCurrentPage(1);
  }, [appointments.past.length]);

  return (
    <div className="lg:px-4 md:px-2 px-1 appointments-header-wrapper" >

      <div className="d-flex justify-content-between align-items-center mb-2 appointments-header">

        <div className="align-items-center mb-3 appointments-title">
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
          onClick={() => setShowModal(true)}
        >
          <FaPlus className="me-2" /> Schedule Appointment
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          <strong>Error:</strong> {error}
          <button
            className="btn  btn-outline-danger ms-2"
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
        <div className="d-flex gap-3 mb-4 appointment-stats">
          <div className="bg-white rounded shadow-sm p-3 flex-grow-1 appointment-stat-card">
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
        <div className="d-flex gap-4 flex-wrap align-items-start appointments-lists">

          <div className="bg-white rounded shadow-sm p-3 flex-grow-1 upcoming-appointments-box" style={{ minWidth: "350px" }}>

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

            {(() => {
              const totalPages = Math.ceil(appointments.upcoming.length / itemsPerPage);
              const startIndex = (upcomingCurrentPage - 1) * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              const paginatedUpcoming = appointments.upcoming.slice(startIndex, endIndex);

              return (
                <>
                  {paginatedUpcoming.length > 0 ? paginatedUpcoming.map((appt) => (
                    <div
                      key={appt.id}
                      className="border rounded p-3 mb-3 mt-3"
                      onClick={() => setSelectedAppointmentId(appt.id)}
                      style={{
                        cursor: "pointer",
                        backgroundColor: selectedAppointmentId === appt.id ? "#FFF4E6" : "white",
                      }}
                    >


                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-2">
                        <div className="d-flex align-items-center gap-2 flex-wrap" style={{ fontFamily: "BasisGrotesquePro" }}>
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

                        {/* Edit & Delete buttons - right aligned */}
                        <div className="d-flex align-items-center gap-2 ms-auto mt-2 mt-md-0">
                          <button
                            className="btn "
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
                            className="btn  ms-2"
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


                      {/* Date, Time, Type - stack on mobile */}
                      <div className="small text-muted d-flex flex-column flex-md-row align-items-start align-items-md-center mb-2" style={{ gap: "8px", fontFamily: "BasisGrotesquePro" }}>
                        <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><DateIcon className="me-1 text-primary" /> {appt.date}</span>
                        <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><AwaitingIcon className="text-success" />{appt.time}</span>
                        <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><MobileIcon className="me-1 text-info" /> {appt.type}</span>
                      </div>


                      <div className="small text-muted d-flex flex-column flex-md-row align-items-start align-items-md-center" style={{ gap: "8px", fontFamily: "BasisGrotesquePro" }}>
                        <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><PersonIcon className="me-1 text-primary" />{appt.person}</span>
                        <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><DiscusIcon className="me-1 text-primary" />{appt.description}</span>
                      </div>

                      {/* Join button for upcoming meetings with meeting link */}
                      {canJoinAppointment(appt) && (
                        <div className="d-flex justify-content-center mt-2">
                          <button
                            className="btn d-inline-flex align-items-center justify-content-center"
                            style={{
                              background: "#F56D2D",
                              color: "#fff",
                              padding: "6px 12px",
                              fontSize: "13px",
                              fontFamily: "BasisGrotesquePro",
                              fontWeight: "500",
                              borderRadius: "6px",
                              border: "none"
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (appt.meeting_link) {
                                window.open(appt.meeting_link, '_blank');
                              } else {
                                toast.error('Meeting link not available', {
                                  position: "top-right",
                                  autoClose: 3000,
                                  className: "custom-toast-success",
                                  bodyClassName: "custom-toast-body",
                                  icon: false,
                                });
                              }
                            }}
                          >
                            <BsCameraVideo style={{ fontSize: "14px", marginRight: "6px" }} /> Join Meeting
                          </button>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="text-center py-4">
                      <p style={{ color: "#6B7280", fontFamily: "BasisGrotesquePro" }}>
                        No upcoming appointments scheduled
                      </p>
                    </div>
                  )}
                  {appointments.upcoming.length > itemsPerPage && (
                    <Pagination
                      currentPage={upcomingCurrentPage}
                      totalPages={totalPages}
                      onPageChange={setUpcomingCurrentPage}
                      totalItems={appointments.upcoming.length}
                      itemsPerPage={itemsPerPage}
                      startIndex={startIndex}
                      endIndex={Math.min(endIndex, appointments.upcoming.length)}
                    />
                  )}
                </>
              );
            })()}
          </div>


          {/* Past */}
          <div className="bg-white rounded shadow-sm p-3 past-appointments-box" style={{ minWidth: "350px", alignSelf: "flex-start" }}>

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


            {(() => {
              const totalPages = Math.ceil(appointments.past.length / itemsPerPage);
              const startIndex = (pastCurrentPage - 1) * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              const paginatedPast = appointments.past.slice(startIndex, endIndex);

              return (
                <>
                  {paginatedPast.length > 0 ? paginatedPast.map((appt) => (
                    <div
                      key={appt.id}
                      className="border rounded p-3 mb-3 appointment-card"
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
                  {appointments.past.length > itemsPerPage && (
                    <Pagination
                      currentPage={pastCurrentPage}
                      totalPages={totalPages}
                      onPageChange={setPastCurrentPage}
                      totalItems={appointments.past.length}
                      itemsPerPage={itemsPerPage}
                      startIndex={startIndex}
                      endIndex={Math.min(endIndex, appointments.past.length)}
                    />
                  )}
                </>
              );
            })()}
          </div>

        </div>
      )}

      {/* Schedule Appointment Modal */}
      <ScheduleAppointmentModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        onSuccess={fetchAppointments}
      />

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
                    Meeting Type
                  </label>
                  <select
                    className="form-select"
                    value={editFormData.meeting_type}
                    onChange={(e) => setEditFormData({ ...editFormData, meeting_type: e.target.value })}
                    style={{ fontFamily: "BasisGrotesquePro" }}
                  >
                    <option value="zoom">Zoom Meeting</option>
                    <option value="google_meet">Google Meet</option>
                    <option value="on_call">Phone Call</option>
                    <option value="in_person">In Person</option>
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
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setEditFormData({ ...editFormData, appointment_date: newDate, appointment_time: '' });
                      // Fetch time slots when date changes
                      fetchEditModalTimeSlots(newDate);
                    }}
                    style={{ fontFamily: "BasisGrotesquePro" }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500" }}>
                    Time (Optional)
                  </label>
                  {loadingEditTimeSlots ? (
                    <div className="form-control" style={{ fontFamily: "BasisGrotesquePro", color: "#6B7280" }}>
                      Loading available time slots...
                    </div>
                  ) : editModalTimeSlots.length > 0 ? (
                    <select
                      className="form-select"
                      value={editFormData.appointment_time}
                      onChange={(e) => setEditFormData({ ...editFormData, appointment_time: e.target.value })}
                      style={{ fontFamily: "BasisGrotesquePro" }}
                    >
                      <option value="">Select a time slot</option>
                      {editModalTimeSlots
                        .filter(slot => slot.is_available)
                        .map((slot, index) => (
                          <option key={index} value={slot.start_time}>
                            {slot.formatted_time || `${slot.start_time_formatted} - ${slot.end_time_formatted}`}
                          </option>
                        ))}
                    </select>
                  ) : editFormData.appointment_date ? (
                    <div className="form-control" style={{ fontFamily: "BasisGrotesquePro", color: "#6B7280", backgroundColor: "#F9FAFB" }}>
                      No available time slots for this date
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.appointment_time}
                      onChange={(e) => setEditFormData({ ...editFormData, appointment_time: e.target.value })}
                      placeholder="Select a date first"
                      style={{ fontFamily: "BasisGrotesquePro", backgroundColor: "#F9FAFB" }}
                      disabled
                    />
                  )}
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

      {/* Cancel Appointment Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelAppointmentConfirm}
        onClose={() => {
          setShowCancelAppointmentConfirm(false);
          setAppointmentToCancel(null);
        }}
        onConfirm={confirmCancelAppointment}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment?"
        confirmText="Cancel Appointment"
        cancelText="Keep Appointment"
        isDestructive={true}
      />
    </div >
  );
}
