import React, { useState, useEffect, useRef } from "react";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { FaPlus } from "react-icons/fa";
import { BsCameraVideo } from "react-icons/bs";
import { toast } from "react-toastify";
import { DateIcon, AwaitingIcon, MobileIcon, PersonIcon, DiscusIcon, ZoomIcon, EsternTimeIcon, CrossIcon } from "./icons";
import { appointmentsAPI, staffAPI, handleAPIError } from "../utils/apiUtils";

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const dayNames = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function ScheduleAppointmentModal({ show, handleClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const step2Ref = useRef(null);
  const [selectedBox, setSelectedBox] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [highlightBox, setHighlightBox] = useState(null);

  // API state management
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  const [formData, setFormData] = useState({
    subject: 'Consultation',
    description: '',
    appointment_with: 1, // Default admin ID
    duration: '1 hour', // Default duration
    timezone: 'eastern', // Default timezone
    meeting_type: 'zoom', // Default meeting type
    phone_number: '', // Required for on_call meetings
    meeting_location: '' // Required for in_person meetings
  });

  // Time slots and availability state
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
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

  // Load staff members on component mount
  useEffect(() => {
    if (show) {
      fetchStaffMembers();
    }
  }, [show]);

  // Function to reset appointment creation form
  const resetAppointmentForm = () => {
    setStep(1);
    setSelectedBox(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedTimeSlot(null);
    setSelectedBox(null);
    setFormData({ subject: 'Consultation', description: '', appointment_with: 1, duration: '1 hour', timezone: 'eastern', meeting_type: 'zoom', phone_number: '', meeting_location: '' });
    setAvailableTimeSlots([]);
    setSelectedCalendarDate(null);
    setAvailableDates([]);
    setCurrentMonth(new Date().getMonth());
    setCurrentYear(new Date().getFullYear());
    setCreateError(null);
    setCreateSuccess(false);
  };

  // Automatically show step 2 when date and time are selected
  useEffect(() => {
    const hasSelectedDate = Boolean(selectedCalendarDate || selectedDate);
    const hasSelectedTime = Boolean(selectedTimeSlot || selectedTime);

    if (hasSelectedDate && hasSelectedTime && step === 1) {
      setStep(2);
      // Scroll to step 2 after a short delay to ensure it's rendered
      setTimeout(() => {
        if (step2Ref.current) {
          step2Ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [selectedCalendarDate, selectedDate, selectedTimeSlot, selectedTime, step]);

  // Function to fetch staff members from API
  const fetchStaffMembers = async () => {
    try {
      setLoadingStaff(true);
      setStaffError(null);
      const response = await staffAPI.getAvailableStaff();

      // Check if API returned an error response
      if (response.success === false) {
        if (response.message && response.message.includes('associated with a firm')) {
          setStaffError('You need to be associated with a firm to schedule appointments. Please contact support for assistance.');
        } else {
          setStaffError(response.message || 'Unable to load staff members. Please try again later.');
        }
        setStaffMembers([]);
        return;
      }

      const staffList = response.data?.staff_members || response.data?.available_staff || [];

      if (response.success && response.data && staffList.length > 0) {
        setStaffMembers(staffList);
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

  // Function to fetch available dates for a staff member
  const fetchAvailableDates = async (staffId) => {
    try {
      setLoadingAvailableDates(true);
      const response = await staffAPI.getAvailableDates(staffId);

      if (response.success && response.data && response.data.available_dates) {
        setAvailableDates(response.data.available_dates);
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

  // Function to fetch time slots for a specific date
  const fetchTimeSlots = async (adminId, date) => {
    try {
      setLoadingTimeSlots(true);
      const response = await staffAPI.getAvailableTimeSlots(adminId, date);

      if (response.success && response.data && response.data.available_slots) {
        const slots = response.data.available_slots
          .filter(slot => slot.is_available && !slot.is_booked)
          .map(slot => {
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
        setAvailableTimeSlots(slots);
      } else {
        setAvailableTimeSlots([]);
      }
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setAvailableTimeSlots([]);
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  // Check if a date is available
  const isDateAvailable = (date) => {
    if (availableDates.length === 0) return false;
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return availableDates.some(availDate => availDate.date === dateString);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    let dayOfWeek = firstDay.getDay();
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0

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

  // Handle date selection
  const handleDateSelection = async (date) => {
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    setSelectedCalendarDate(date);
    setSelectedDate(date.getDate());
    setSelectedTime(null);
    setSelectedTimeSlot(null);
    await fetchTimeSlots(selectedAdminId, formattedDate);
  };

  // Get current timezone info string
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

  // Create appointment
  const createAppointment = async () => {
    if (!(selectedCalendarDate || selectedDate) || !(selectedTimeSlot || selectedTime) || !formData.subject.trim()) {
      toast.error('Please fill in all required fields', {
        position: "top-right",
        autoClose: 3000,
        className: "custom-toast-success",
        bodyClassName: "custom-toast-body",
        icon: false,
      });
      return;
    }

    if (formData.meeting_type === 'on_call' && !formData.phone_number.trim()) {
      toast.error('Phone number is required for phone call meetings', {
        position: "top-right",
        autoClose: 3000,
        className: "custom-toast-success",
        bodyClassName: "custom-toast-body",
        icon: false,
      });
      return;
    }

    if (formData.meeting_type === 'in_person' && !formData.meeting_location.trim()) {
      toast.error('Meeting location is required for in-person meetings', {
        position: "top-right",
        autoClose: 3000,
        className: "custom-toast-success",
        bodyClassName: "custom-toast-body",
        icon: false,
      });
      return;
    }

    try {
      setCreatingAppointment(true);

      const appointmentDate = selectedCalendarDate
        ? `${selectedCalendarDate.getFullYear()}-${String(selectedCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(selectedCalendarDate.getDate()).padStart(2, '0')}`
        : `${currentYear}-06-${selectedDate.toString().padStart(2, '0')}`;

      let appointmentTime;
      if (selectedTimeSlot?.start_time) {
        const timeStr = selectedTimeSlot.start_time;
        appointmentTime = timeStr.match(/^\d{2}:\d{2}:\d{2}$/) ? timeStr
          : timeStr.match(/^\d{2}:\d{2}$/) ? `${timeStr}:00`
            : timeStr.slice(0, 5) + ':00';
      } else if (selectedTime) {
        const [time, period] = selectedTime.split(' ');
        const [hours, minutes] = time.split(':');
        let hour24 = parseInt(hours, 10);
        if (period === 'PM' && hour24 !== 12) hour24 += 12;
        if (period === 'AM' && hour24 === 12) hour24 = 0;
        appointmentTime = `${hour24.toString().padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
      }

      if (!appointmentTime) {
        toast.error('Please choose an available time slot', {
          position: "top-right",
          autoClose: 3000,
          className: "custom-toast-success",
          bodyClassName: "custom-toast-body",
          icon: false,
        });
        return;
      }

      let appointmentDuration = 30;
      if (selectedTimeSlot && selectedTimeSlot.start_time && selectedTimeSlot.end_time) {
        const start = new Date(`2000-01-01 ${selectedTimeSlot.start_time}`);
        const end = new Date(`2000-01-01 ${selectedTimeSlot.end_time}`);
        appointmentDuration = (end - start) / (1000 * 60);
      }

      const appointmentData = {
        appointment_with_id: formData.appointment_with,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        appointment_duration: appointmentDuration,
        appointment_type: 'consultation',
        meeting_type: formData.meeting_type,
        subject: formData.subject,
        description: formData.description
      };

      if (formData.meeting_type === 'on_call') appointmentData.phone_number = formData.phone_number.trim();
      if (formData.meeting_type === 'in_person') appointmentData.meeting_location = formData.meeting_location.trim();

      const response = await appointmentsAPI.createAppointment(appointmentData);

      if (response.success) {
        toast.success('Appointment created successfully!', {
          position: "top-right",
          autoClose: 3000,
          className: "custom-toast-success",
          bodyClassName: "custom-toast-body",
        });
        resetAppointmentForm();
        if (onSuccess) onSuccess();
        setTimeout(() => handleClose(), 1000);
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
        icon: false,
      });
    } finally {
      setCreatingAppointment(false);
    }
  };

  if (!show) return null;

  return (
    <div>
      <style>{`
        .appointment-modal-overlay > div {
          max-height: none !important;
          overflow: visible !important;
          animation: none !important;
          transition: none !important;
        }
      `}</style>
      <div
        className="appointment-modal-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center overflow-y-auto"
        style={{
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000001,
          padding: '20px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            resetAppointmentForm();
            handleClose();
          }
        }}
      >
        <div
          className="rounded-4"
          style={{
            width: '100%',
            maxWidth: '600px',
            backgroundColor: '#fff',
            margin: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-3 border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0" style={{ color: '#3B4A66', fontSize: '18px', fontWeight: '500', fontFamily: 'BasisGrotesquePro' }}>Schedule New Appointment</h5>
              <button onClick={() => {
                resetAppointmentForm();
                handleClose();
              }} className="btn p-1" style={{ background: 'none', border: 'none' }}>
                <CrossIcon />
              </button>
            </div>
            <p className="mb-0 mt-1" style={{ color: '#4B5563', fontSize: '13px', fontFamily: 'BasisGrotesquePro' }}>
              Schedule a meeting with your tax professional
            </p>
          </div>

          {/* Body */}
          <div className="p-3">
            {staffError && staffError.includes('associated with a firm') && (
              <div className="alert alert-warning mb-3" role="alert" style={{
                backgroundColor: "#FEF3C7", border: "1px solid #F59E0B", color: "#92400E",
                fontFamily: "BasisGrotesquePro", borderRadius: "8px", padding: "12px 16px"
              }}>
                <strong style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <svg width="20" height="20" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.99992 3.33301V4.99968M9.16659 4.99968C9.16659 7.30086 7.30111 9.16634 4.99992 9.16634C2.69873 9.16634 0.833252 7.30086 0.833252 4.99968C0.833252 2.69849 2.69873 0.833008 4.99992 0.833008C7.30111 0.833008 9.16659 2.69849 9.16659 4.99968Z" stroke="#F56D2D" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 6.66699H5.01042" stroke="#F56D2D" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Firm Association Required
                </strong>
                <small>{staffError}</small>
              </div>
            )}

            {!(staffError && staffError.includes('associated with a firm')) && (
              <>
                <div className="option-box mb-3" style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "15px", background: "#fff" }}>
                  {staffMembers.length > 1 && (
                    <div className="mb-3">
                      <label style={{ fontSize: "13px", fontWeight: "500", color: "#3B4A66", fontFamily: "BasisGrotesquePro", marginBottom: "6px", display: "block" }}>
                        Select Tax Professional:
                      </label>
                      <select
                        className="form-control"
                        value={selectedAdminId || ''}
                        onChange={(e) => {
                          const newAdminId = parseInt(e.target.value);
                          setSelectedAdminId(newAdminId);
                          setFormData(prev => ({ ...prev, appointment_with: newAdminId }));
                          setSelectedBox(null);
                          setSelectedDate(null);
                          setSelectedTime(null);
                          setSelectedTimeSlot(null);
                          setAvailableTimeSlots([]);
                          setSelectedCalendarDate(null);
                          setAvailableDates([]);
                        }}
                        style={{ fontFamily: "BasisGrotesquePro", fontSize: "14px", padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: "8px", width: "100%" }}
                      >
                        {staffMembers.map((staff) => (
                          <option key={staff.id} value={staff.id}>{staff.name} {staff.role_display ? `(${staff.role_display})` : ''}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <h6 style={{ fontSize: "14px", fontWeight: "500", color: "#3B4A66", fontFamily: "BasisGrotesquePro", marginBottom: "12px" }}>
                    Schedule a free call with {staffMembers.find(s => s.id === selectedAdminId)?.name || 'Tax Professional'}
                  </h6>

                  <div className="d-flex flex-wrap gap-2">
                    {['zoom', 'google_meet', 'in_person', 'on_call'].map(type => (
                      <button
                        key={type}
                        onClick={() => setFormData(prev => ({ ...prev, meeting_type: type }))}
                        style={{
                          border: formData.meeting_type === type ? "2px solid #F56D2D" : "1px solid #E5E7EB",
                          background: formData.meeting_type === type ? "#F56D2D" : "#fff",
                          color: formData.meeting_type === type ? "#fff" : "#374151",
                          borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontFamily: "BasisGrotesquePro", fontWeight: "500", cursor: "pointer"
                        }}
                      >
                        {type === 'zoom' ? 'Zoom' : type === 'google_meet' ? 'Google Meet' : type === 'in_person' ? 'In Person' : 'Phone Call'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="option-box">
                  <div
                    onClick={async () => {
                      if (selectedBox === 1) {
                        setSelectedBox(null);
                        setSelectedDate(null);
                        setSelectedTime(null);
                        setSelectedTimeSlot(null);
                        setAvailableTimeSlots([]);
                        setSelectedCalendarDate(null);
                        setAvailableDates([]);
                      } else {
                        setSelectedBox(1);
                        setHighlightBox(1);
                        await fetchAvailableDates(selectedAdminId);
                      }
                    }}
                    className={`info ${selectedBox === 1 ? "active" : ""}`}
                    style={{ cursor: "pointer", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "15px", marginBottom: "15px" }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex gap-2 align-items-start">
                        <span><ZoomIcon /></span>
                        <div>
                          <strong className="option-title">
                            Schedule a free {formData.meeting_type === 'zoom' ? 'Zoom call' : formData.meeting_type === 'google_meet' ? 'Google Meet' : formData.meeting_type === 'in_person' ? 'in-person meeting' : 'phone call'}
                          </strong>
                        </div>
                      </div>
                      <span style={{ fontSize: "20px", color: "#3B4A66", transform: selectedBox === 1 ? "rotate(90deg)" : "none", transition: "transform 0.3s ease" }}>›</span>
                    </div>

                    {selectedBox === 1 && (
                      <div className="mt-3">
                        {!loadingAvailableDates && availableDates.length === 0 ? (
                          <div className="text-center p-4 bg-light rounded border">
                            <h6>No appointment times available.</h6>
                            <p className="small text-muted mb-0">This firm hasn't set availability yet.</p>
                          </div>
                        ) : (
                          <div className="row">
                            <div className="col-12 col-md-7">
                              <h6 className="small fw-bold mb-2">Select a date</h6>
                              <div className="d-flex justify-content-between align-items-center mb-2 small text-muted">
                                <span>{monthNames[currentMonth]} {currentYear}</span>
                                <div>
                                  <button onClick={(e) => { e.stopPropagation(); navigateMonth(-1); }} className="btn btn-sm">&lt;</button>
                                  <button onClick={(e) => { e.stopPropagation(); navigateMonth(1); }} className="btn btn-sm">&gt;</button>
                                </div>
                              </div>
                              <div className="d-flex mb-1 border-bottom pb-1">
                                {dayNames.map(day => <div key={day} style={{ flex: 1, textAlign: "center", fontSize: "10px", color: "#6B7280" }}>{day}</div>)}
                              </div>
                              <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                                {generateCalendarDays().map((date, idx) => {
                                  const isCurrentMonth = date.getMonth() === currentMonth;
                                  const isSelected = selectedCalendarDate && date.toDateString() === selectedCalendarDate.toDateString();
                                  const isAvailable = isDateAvailable(date);
                                  const isPast = new Date(date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
                                  const canSelect = isAvailable && !isPast;
                                  return (
                                    <button
                                      key={idx}
                                      onClick={(e) => { e.stopPropagation(); if (canSelect) handleDateSelection(date); }}
                                      disabled={!canSelect}
                                      style={{
                                        border: "none", padding: "8px 0", fontSize: "11px", borderRadius: "4px",
                                        backgroundColor: isSelected ? '#F56D2D' : 'transparent',
                                        color: isSelected ? '#fff' : (canSelect ? '#374151' : '#D1D5DB'),
                                        cursor: canSelect ? 'pointer' : 'default',
                                        opacity: isCurrentMonth ? 1 : 0.5
                                      }}
                                    >
                                      {date.getDate()}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="col-12 col-md-5">
                              <h6 className="small fw-bold mb-2">Select a time</h6>
                              <select
                                className="form-select form-select-sm mb-2"
                                value={formData.timezone}
                                onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                                style={{ fontSize: "11px" }}
                              >
                                <option value="eastern">Eastern Time</option>
                                <option value="central">Central Time</option>
                                <option value="mountain">Mountain Time</option>
                                <option value="pacific">Pacific Time</option>
                              </select>
                              <div className="time-list">
                                {loadingTimeSlots ? <small>Loading...</small> :
                                  availableTimeSlots.length > 0 ? availableTimeSlots.map((slot, i) => (
                                    <button
                                      key={i}
                                      onClick={(e) => { e.stopPropagation(); setSelectedTime(slot.start_time_display); setSelectedTimeSlot(slot); }}
                                      className={`btn btn-sm w-100 mb-1 border ${selectedTime === slot.start_time_display ? 'btn-primary' : 'btn-light'}`}
                                      style={{ fontSize: "11px" }}
                                    >
                                      {slot.start_time_display}
                                    </button>
                                  )) : <small className="text-muted">Select a date first</small>}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {step >= 2 && (
              <div ref={step2Ref} className="mt-2 border-top pt-3">
                {createError && <div className="alert alert-danger small">{createError}</div>}
                <div className="row g-3">
                  <div className="col-12">
                    <div className="p-3 border rounded bg-light">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <ZoomIcon />
                        <strong className="small">Schedule {formData.meeting_type} with {staffMembers.find(s => s.id === selectedAdminId)?.name}</strong>
                      </div>
                      <div className="small text-muted">
                        <div className="d-flex align-items-center gap-2"><DateIcon /> {selectedTime}, {selectedCalendarDate?.toLocaleDateString()}</div>
                        <div className="d-flex align-items-center gap-2"><EsternTimeIcon /> {getCurrentTimezone()}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="small fw-bold mb-1">Subject</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="2"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    />
                  </div>
                  <div className="col-12">
                    <label className="small fw-bold mb-1">Description</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  {formData.meeting_type === 'on_call' && (
                    <div className="col-12">
                      <label className="small fw-bold mb-1">Phone Number *</label>
                      <PhoneInput
                        country="us"
                        value={formData.phone_number}
                        onChange={(phone) => setFormData(prev => ({ ...prev, phone_number: phone }))}
                        inputClass="form-control form-control-sm w-100"
                      />
                    </div>
                  )}
                  {formData.meeting_type === 'in_person' && (
                    <div className="col-12">
                      <label className="small fw-bold mb-1">Meeting Location *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.meeting_location}
                        onChange={(e) => setFormData(prev => ({ ...prev, meeting_location: e.target.value }))}
                      />
                    </div>
                  )}
                  <div className="col-12 text-end">
                    <button
                      className="btn btn-primary"
                      disabled={creatingAppointment}
                      onClick={createAppointment}
                      style={{ background: "#F56D2D", border: "none" }}
                    >
                      {creatingAppointment ? 'Creating...' : 'Submit'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
