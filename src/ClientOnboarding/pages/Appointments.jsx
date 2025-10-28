import React, { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { BsCameraVideo } from "react-icons/bs";
import { DateIcon, AwaitingIcon, MobileIcon, PersonIcon, DiscusIcon, EditIcon, DeleteIcon, AppoinIcon, MonthIcon, ZoomIcon, EsternTimeIcon, CrossIcon } from "../components/icons";
import { appointmentsAPI, adminAvailabilityAPI, timeSlotsAPI, handleAPIError } from "../utils/apiUtils";
import "../styles/Icon.css"
import "../styles/fonts.css"
export default function Appointments() {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedBox, setSelectedBox] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
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
    appointment_with: 1 // Default admin ID
  });
  
  // Appointment editing state
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updatingAppointment, setUpdatingAppointment] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
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

  // Function to create appointment
  const createAppointment = async () => {
    if (!selectedDate || !selectedTime || !formData.subject.trim()) {
      setCreateError('Please fill in all required fields');
      return;
    }

    try {
      setCreatingAppointment(true);
      setCreateError(null);
      
      // Convert selected date and time to API format
      const currentYear = new Date().getFullYear();
      const appointmentDate = `${currentYear}-06-${selectedDate.toString().padStart(2, '0')}`;
      
      // Convert time from "09:00 AM" format to "09:00:00" format
      const time12Hour = selectedTime;
      const [time, period] = time12Hour.split(' ');
      const [hours, minutes] = time.split(':');
      let hour24 = parseInt(hours);
      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;
      const appointmentTime = `${hour24.toString().padStart(2, '0')}:${minutes}:00`;

      const appointmentData = {
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        appointment_type: selectedBox === 2 ? 'consultation' : 'phone_call',
        subject: formData.subject,
        appointment_with: formData.appointment_with
      };

      const response = await appointmentsAPI.createAppointment(appointmentData);
      
      if (response.success) {
        setCreateSuccess(true);
        // Reset form
        setFormData({ subject: '', appointment_with: 1 });
        setSelectedDate(null);
        setSelectedTime(null);
        setSelectedBox(null);
        setStep(1);
        
        // Refresh appointments list
        await fetchAppointments();
        
        // Close modal after a short delay
        setTimeout(() => {
          setShowModal(false);
          setCreateSuccess(false);
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to create appointment');
      }
    } catch (err) {
      console.error('Error creating appointment:', err);
      setCreateError(handleAPIError(err));
    } finally {
      setCreatingAppointment(false);
    }
  };

  // Function to cancel appointment
  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const response = await appointmentsAPI.deleteAppointment(appointmentId);
      
      if (response.success) {
        // Refresh appointments list
        await fetchAppointments();
        alert('Appointment cancelled successfully');
      } else {
        throw new Error(response.message || 'Failed to cancel appointment');
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert(handleAPIError(err));
    }
  };

  // Function to fetch time slots for a specific date
  const fetchTimeSlots = async (adminId, date) => {
    try {
      setLoadingTimeSlots(true);
      console.log('Fetching time slots for admin:', adminId, 'date:', date);
      
      const response = await timeSlotsAPI.getTimeSlots(adminId, date);
      console.log('Time slots API response:', response);
      
      if (response.success && response.data) {
        const slots = response.data.slots || [];
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
      setUpdateError('Please fill in all required fields');
      return;
    }

    try {
      setUpdatingAppointment(true);
      setUpdateError(null);
      
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
        setUpdateSuccess(true);
        // Refresh appointments list
        await fetchAppointments();
        
        // Close modal after a short delay
        setTimeout(() => {
          setShowEditModal(false);
          setUpdateSuccess(false);
          setEditingAppointment(null);
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to update appointment');
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
      setUpdateError(handleAPIError(err));
    } finally {
      setUpdatingAppointment(false);
    }
  };

  // Function to handle date selection and fetch time slots
  const handleDateSelection = async (day) => {
    setSelectedDate(day);
    setSelectedTime(null); // Reset selected time when date changes
    
    const currentYear = new Date().getFullYear();
    const selectedDate = `${currentYear}-06-${day.toString().padStart(2, '0')}`;
    
    console.log('Date selected:', day, 'Formatted date:', selectedDate, 'Admin ID:', selectedAdminId);
    
    // Call the time slots API
    await fetchTimeSlots(selectedAdminId, selectedDate);
  };

  // Function to reset appointment creation form
  const resetAppointmentForm = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedBox(null);
    setFormData({ subject: '', appointment_with: 1 });
    setAvailableTimeSlots([]);
    setCreateError(null);
    setCreateSuccess(false);
  };

  // Load appointments on component mount
  useEffect(() => {
    fetchAppointments();
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
          onClick={() => {
            resetAppointmentForm();
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
                      background: "#ffffff",
                      border: "1px solid #E5E7EB",
                      borderRadius: "30%",
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#3B4A66",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(appt);
                    }}
                  >
                    <EditIcon style={{ width: "16px", height: "16px" }} />
                  </button>

                  <button
                    className="btn btn-sm ms-2"
                    style={{
                      background: "#ffffff",
                      border: "1px solid #E5E7EB",
                      borderRadius: "50%",
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#991B1B",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelAppointment(appt.id);
                    }}
                  >
                    <DeleteIcon style={{ width: "16px", height: "16px" }} />
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
        <div className="custom-popup-overlay">
          <div className="custom-popup-container">
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
              <p className="popup-subtitle">Schedule a meeting with your tax professional</p>
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <div className="popup-body">
                {(selectedBox
                  ? [
                    {
                      id: selectedBox,
                      ...[
                        {
                          id: 1,
                          icon: <span className="mobile-icon-custom"><MobileIcon /></span>,
                          title: "Schedule a free Phone call with Sarah Johnson",
                          desc: "Use this to schedule 30 minute phone call meeting",
                        },
                        {
                          id: 2,
                          icon: <span className="icon-custom"><ZoomIcon /></span>,
                          title: "Schedule a free Zoom call with John Smith",
                          desc: "Use this to schedule 1 hour long zoom meeting",
                        },
                        {
                          id: 3,
                          icon: <span className="mobile-icon-custom"><MobileIcon /></span>,
                          title: "Schedule a free Phone call with Sarah Johnson",
                          desc: "Use this to schedule 30 minute phone call meeting",
                        },
                      ].find((opt) => opt.id === selectedBox),
                    },
                  ]
                  : [
                    {
                      id: 1,
                      icon: <span className="mobile-icon-custom"><MobileIcon /></span>,
                      title: "Schedule a free Phone call with Sarah Johnson",
                      desc: "Use this to schedule 30 minute phone call meeting",
                    },
                    {
                      id: 2,
                      icon: <span className="icon-custom"><ZoomIcon /></span>,
                      title: "Schedule a free Zoom call with John Smith",
                      desc: "Use this to schedule 1 hour long zoom meeting",
                    },
                    {
                      id: 3,
                      icon: <span className="mobile-icon-custom"><MobileIcon /></span>,
                      title: "Schedule a free Phone call with Sarah Johnson",
                      desc: "Use this to schedule 30 minute phone call meeting",
                    },
                  ]
                ).map((option) => (
                  <div key={option.id} className="option-box">
                    <div
                      onClick={() => setHighlightBox(highlightBox === option.id ? null : option.id)}
                      className={`info  ${highlightBox === option.id ? "active" : ""}`}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex gap-2 align-items-start">
                          <span>{option.icon}</span>
                          <div>
                            <strong className="option-title">{option.title}</strong>
                            <p className="option-desc">{option.desc}</p>
                          </div>
                        </div>

                        {selectedBox !== option.id && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBox(option.id);
                            }}
                            className="arrow-icon"
                          >
                            ›
                          </span>
                        )}
                      </div>

                      {selectedBox === option.id && (
                        <div className="mt-3">
                          <button className="btn schedule-btn d-flex align-items-center gap-2">
                            <span className="d-flex align-items-center small-icon">
                              <AwaitingIcon className="text-success" />
                            </span>
                            <span className="schedule-time">30 min</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {selectedBox === option.id && (
                      <>
                        <div className="selection-box">
                          <div className="row">
                            <div className="col-7">
                              <h6 className="selection-title">Select a date</h6>
                              <div className="calendar-grid">
                                {dates.map((day) => (
                                  <button
                                    key={day}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDateSelection(day);
                                    }}
                                    className={`calendar-btn ${selectedDate === day ? "active" : ""
                                      }`}
                                  >
                                    {day}
                                  </button>
                                ))}
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
                                  availableTimeSlots.map((slot) => {
                                    // Convert 24-hour format to 12-hour format
                                    const [hours, minutes] = slot.time.split(':');
                                    const hour24 = parseInt(hours);
                                    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                                    const period = hour24 >= 12 ? 'PM' : 'AM';
                                    const time12Hour = `${hour12}:${minutes} ${period}`;
                                    
                                    return (
                                      <button
                                        key={slot.time}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (slot.available) {
                                            setSelectedTime(time12Hour);
                                          }
                                        }}
                                        className={`time-btn ${selectedTime === time12Hour ? "active" : ""} ${!slot.available ? "disabled" : ""}`}
                                        disabled={!slot.available}
                                        style={{
                                          opacity: slot.available ? 1 : 0.5,
                                          cursor: slot.available ? 'pointer' : 'not-allowed'
                                        }}
                                      >
                                        {time12Hour}
                                        {!slot.available && <small className="d-block">Booked</small>}
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
                              setAvailableTimeSlots([]);
                            }}
                            className="btn btn-secondary"
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
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}


            {/* Step 2 : Subject of Meeting */}
            {step === 2 && (
              <div style={{ padding: "20px" }}>
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
                        icon: <span className="mobile-icon-custom"><MobileIcon /></span>,
                        title: "Schedule a free Phone call with Sarah Johnson",
                        desc: "Use this to schedule 30 minute phone call meeting",
                      },
                      {
                        id: 2,
                        icon: <span className="icon-custom"><ZoomIcon /></span>,
                        title: "Schedule a free Zoom call with John Smith",
                        desc: "Use this to schedule 1 hour long zoom meeting",
                      },
                      {
                        id: 3,
                        icon: <span className="mobile-icon-custom"><MobileIcon /></span>,
                        title: "Schedule a free Phone call with Sarah Johnson",
                        desc: "Use this to schedule 30 minute phone call meeting",
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
                                  fontWeight: "400"
                                }}
                              >
                                {selectedOpt.desc}
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
                                  30 min
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
                              <span className="d-flex align-items-center small-icon"><AwaitingIcon className="text-success" /></span>
                              {selectedDate} June 2025 {selectedTime}
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
                              Eastern Time - US & Canada (2:12 pm)
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
                      placeholder="Write meeting subject (e.g., Tax Return Review)"
                      style={{
                        width: "100%",
                        minHeight: "80px",
                        border: "1px solid #E5E7EB",
                        borderRadius: "6px",
                        padding: "8px",
                        fontSize: "13px",
                        fontFamily: "BasisGrotesquePro",
                      }}
                    ></textarea>
                  </div>
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
                      background: "#E5E7EB",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontFamily: "BasisGrotesquePro",
                    }}
                  >
                    Back
                  </button>
                  <button
                    style={{
                      background: "#F56D2D",
                      color: "#fff",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontFamily: "BasisGrotesquePro",
                    }}
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditModal && editingAppointment && (
        <div className="custom-popup-overlay">
          <div className="custom-popup-container">
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
              {/* Error Message */}
              {updateError && (
                <div className="alert alert-danger mb-3" role="alert">
                  <strong>Error:</strong> {updateError}
                </div>
              )}

              {/* Success Message */}
              {updateSuccess && (
                <div className="alert alert-success mb-3" role="alert">
                  <strong>Success:</strong> Appointment updated successfully!
                </div>
              )}

              <div className="mb-3">
                <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500" }}>
                  Subject
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={editFormData.subject}
                  onChange={(e) => setEditFormData({...editFormData, subject: e.target.value})}
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
                  onChange={(e) => setEditFormData({...editFormData, appointment_type: e.target.value})}
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
                  onChange={(e) => setEditFormData({...editFormData, appointment_date: e.target.value})}
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
                  onChange={(e) => setEditFormData({...editFormData, appointment_time: e.target.value})}
                  style={{ fontFamily: "BasisGrotesquePro" }}
                />
              </div>

              <div className="d-flex justify-content-between">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                  disabled={updatingAppointment}
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
      )}
    </div>
  );
}
