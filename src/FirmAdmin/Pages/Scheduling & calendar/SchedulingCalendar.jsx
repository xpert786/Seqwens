import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { firmAdminCalendarAPI, firmAdminMeetingsAPI, firmAdminClientsAPI, firmAdminStaffAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import SetAvailabilityModal from './SetAvailabilityModal';

const SchedulingCalendar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const activeTab = location.pathname.includes('/appointments') ? 'Appointments' :
        location.pathname.includes('/features') ? 'Features' :
            location.pathname.includes('/staff') ? 'Staff' : 'Calendar';
    const [viewMode, setViewMode] = useState('Monthly');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [eventId, setEventId] = useState('');
    const [calendarType, setCalendarType] = useState('Firm Calendar');
    const [provider, setProvider] = useState('Google Calendar');
    const [direction, setDirection] = useState('One-way (Pull)');
    // Calendar data from API
    const [calendarData, setCalendarData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [appointmentsByDate, setAppointmentsByDate] = useState({});
    const [statistics, setStatistics] = useState({
        scheduled_month: 0,
        completed: 0,
        no_show_rate: 0,
        avg_duration_display: '0m'
    });
    const [todayEvents, setTodayEvents] = useState({ date: '', date_display: '', events: [], count: 0 });
    const [upcomingEvents, setUpcomingEvents] = useState({ period: '', date_from: '', date_to: '', events: [], count: 0 });
    const [highlightDate, setHighlightDate] = useState(null);
    const [userAdjustedDate, setUserAdjustedDate] = useState(false);

    // Add Event Modal State - matching tax preparer modal structure
    const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
    const [isSetAvailabilityModalOpen, setIsSetAvailabilityModalOpen] = useState(false);
    const [eventTitle, setEventTitle] = useState('');
    const [appointmentDuration, setAppointmentDuration] = useState(30);
    const [timezone, setTimezone] = useState('America/New_York');
    const [appointmentDate, setAppointmentDate] = useState('');
    const [slots, setSlots] = useState([{ id: 1, time: '09:00', client_id: '' }]);
    const [meetingType, setMeetingType] = useState('zoom');
    const [description, setDescription] = useState('');
    const [clients, setClients] = useState([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [staffMembers, setStaffMembers] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(false);
    const [assignedStaffId, setAssignedStaffId] = useState('');

    // Helpers to normalize appointment dates without UTC shifts
    const formatDateKey = (dateObj) => {
        if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return '';
        return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    };

    const convertAppointmentToEvent = (appointment = {}) => {
        const dateParts = (appointment.appointment_date || '').split('-').map(Number);
        const year = dateParts[0] || new Date().getFullYear();
        const monthIndex = (dateParts[1] || 1) - 1;
        const day = dateParts[2] || 1;

        const timeStr = appointment.appointment_time || '00:00:00';
        const [hours = 0, minutes = 0] = timeStr.split(':').map(Number);

        const appointmentDate = new Date(year, monthIndex, day, hours || 0, minutes || 0);

        return {
            ...appointment,
            date: appointmentDate,
            dateKey: formatDateKey(appointmentDate),
            timeSort: (hours || 0) * 60 + (minutes || 0),
        };
    };

    const normalizeAppointmentsByDate = (appsMap = {}) => {
        const normalized = {};
        Object.entries(appsMap).forEach(([dateKey, appointments = []]) => {
            appointments.forEach((appointment) => {
                const event = convertAppointmentToEvent(appointment);
                const targetKey = event.dateKey || dateKey;
                if (!normalized[targetKey]) {
                    normalized[targetKey] = [];
                }
                normalized[targetKey].push(event);
            });
        });
        return normalized;
    };

    const mergeEventListIntoMap = (baseMap = {}, events = []) => {
        const merged = { ...baseMap };
        events.forEach((appointment = {}) => {
            const event = convertAppointmentToEvent(appointment);
            if (!event.dateKey) return;
            if (!merged[event.dateKey]) {
                merged[event.dateKey] = [];
            }
            const alreadyExists = merged[event.dateKey].some((existing) => {
                if (existing.id && event.id) {
                    return existing.id === event.id;
                }
                return (
                    existing.appointment_time === event.appointment_time &&
                    existing.appointment_with === event.appointment_with &&
                    existing.subject === event.subject
                );
            });
            if (!alreadyExists) {
                merged[event.dateKey].push(event);
            }
        });
        return merged;
    };

    // Overlap warning modal state
    const [showOverlapModal, setShowOverlapModal] = useState(false);
    const [overlappingAppointments, setOverlappingAppointments] = useState([]);
    const [newAppointmentDetails, setNewAppointmentDetails] = useState(null);
    const [creatingMeeting, setCreatingMeeting] = useState(false);
    const [confirmingOverwrite, setConfirmingOverwrite] = useState(false);
    const [eventsModal, setEventsModal] = useState({
        open: false,
        dateLabel: '',
        events: []
    });

    // Fetch calendar data from API
    const fetchCalendarData = async () => {
        try {
            setLoading(true);

            // Format date as YYYY-MM-DD
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const day = currentDate.getDate();
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // Map viewMode to API view parameter
            const viewMap = {
                'Day': 'day',
                'Week': 'week',
                'Monthly': 'month',
                'Years': 'year',
                'Agenda': 'agenda'
            };
            const apiView = viewMap[viewMode] || 'month';

            const response = await firmAdminCalendarAPI.getCalendar({
                view: apiView,
                date: dateStr
            });

            if (response.success && response.data) {
                setCalendarData(response.data);

                // Set appointments by date
                const appsByDate = response.data.calendar?.appointments_by_date || {};
                let normalizedApps = normalizeAppointmentsByDate(appsByDate);

                // Set statistics
                if (response.data.statistics) {
                    setStatistics({
                        scheduled_month: response.data.statistics.scheduled_month || 0,
                        completed: response.data.statistics.completed || 0,
                        no_show_rate: response.data.statistics.no_show_rate || 0,
                        avg_duration_display: response.data.statistics.avg_duration_display || '0m'
                    });
                }

                // Set today's events
                if (response.data.today_events) {
                    setTodayEvents({
                        date: response.data.today_events.date || '',
                        date_display: response.data.today_events.date_display || '',
                        events: response.data.today_events.events || [],
                        count: response.data.today_events.count || 0
                    });
                    if (Array.isArray(response.data.today_events.events) && response.data.today_events.events.length > 0) {
                        normalizedApps = mergeEventListIntoMap(normalizedApps, response.data.today_events.events);
                    }
                }

                // Set upcoming events
                if (response.data.upcoming_events) {
                    setUpcomingEvents({
                        period: response.data.upcoming_events.period || '',
                        date_from: response.data.upcoming_events.date_from || '',
                        date_to: response.data.upcoming_events.date_to || '',
                        events: response.data.upcoming_events.events || [],
                        count: response.data.upcoming_events.count || 0
                    });
                    if (Array.isArray(response.data.upcoming_events.events) && response.data.upcoming_events.events.length > 0) {
                        normalizedApps = mergeEventListIntoMap(normalizedApps, response.data.upcoming_events.events);
                    }
                }

                setAppointmentsByDate(normalizedApps);

                const highlightDateStr =
                    response.data.today_events?.date ||
                    response.data.upcoming_events?.events?.[0]?.appointment_date ||
                    response.data.calendar?.target_date ||
                    null;

                if (highlightDateStr) {
                    const parsedHighlight = new Date(highlightDateStr);
                    if (!Number.isNaN(parsedHighlight.getTime())) {
                        setHighlightDate(parsedHighlight);
                        const sameDay =
                            currentDate.getFullYear() === parsedHighlight.getFullYear() &&
                            currentDate.getMonth() === parsedHighlight.getMonth() &&
                            currentDate.getDate() === parsedHighlight.getDate();
                        if (!userAdjustedDate && !sameDay) {
                            setCurrentDate(parsedHighlight);
                        }
                    }
                } else {
                    setHighlightDate(null);
                }
            }
        } catch (error) {
            console.error('Error fetching calendar data:', error);
            toast.error(handleAPIError(error) || 'Failed to load calendar data', {
                position: 'top-right',
                autoClose: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    // Fetch calendar data when component mounts or date/view changes
    useEffect(() => {
        fetchCalendarData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), viewMode]);

    // Fetch clients and staff when modal opens
    useEffect(() => {
        if (isAddEventModalOpen) {
            fetchClients();
            fetchStaffMembers();
        }
    }, [isAddEventModalOpen]);

    // Fetch clients list
    const fetchClients = async () => {
        try {
            setLoadingClients(true);
            const response = await firmAdminClientsAPI.listClients({ page_size: 100 });

            if (response.success && response.data) {
                const clientsList = response.data.clients || [];
                setClients(clientsList);
            } else {
                setClients([]);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
            toast.error(handleAPIError(error) || 'Failed to load clients', {
                position: 'top-right',
                autoClose: 3000
            });
            setClients([]);
        } finally {
            setLoadingClients(false);
        }
    };

    // Fetch staff members list
    const fetchStaffMembers = async () => {
        try {
            setLoadingStaff(true);
            const response = await firmAdminStaffAPI.listStaff({ status: 'active' });

            if (response.success && response.data) {
                const staffList = response.data.staff_members || [];
                setStaffMembers(staffList);
            } else {
                setStaffMembers([]);
            }
        } catch (error) {
            console.error('Error fetching staff members:', error);
            toast.error(handleAPIError(error) || 'Failed to load staff members', {
                position: 'top-right',
                autoClose: 3000
            });
            setStaffMembers([]);
        } finally {
            setLoadingStaff(false);
        }
    };

    // Helper function to format time from HH:MM:SS to 12-hour format
    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    const getEventTimeRange = (event = {}) => {
        if (!event || !event.appointment_time) return '';
        const start = formatTime(event.appointment_time);
        if (event.end_time) {
            return `${start} - ${formatTime(event.end_time)}`;
        }
        if (event.appointment_duration) {
            const [hours, minutes] = event.appointment_time.split(':').map(Number);
            const duration = Number(event.appointment_duration) || 0;
            const startMinutes = (hours || 0) * 60 + (minutes || 0);
            const endMinutes = startMinutes + duration;
            const endHours = Math.floor(endMinutes / 60) % 24;
            const endMins = endMinutes % 60;
            const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00`;
            return `${start} - ${formatTime(endTime)}`;
        }
        return start;
    };

    const getEventChipClasses = (status = '') => {
        const normalized = status?.toLowerCase();
        if (normalized === 'pending') {
            return 'bg-yellow-500 text-white';
        }
        if (normalized === 'cancelled' || normalized === 'canceled') {
            return 'bg-gray-300 text-gray-700';
        }
        if (normalized === 'completed' || normalized === 'confirmed') {
            return 'bg-green-500 text-white';
        }
        return 'bg-[#F56D2D] text-white';
    };

    const getEventParticipants = (event = {}) => {
        const client = event.user_name || event.user || '';
        const staff = event.appointment_with_name || '';
        if (client && staff) return `${client} with ${staff}`;
        return client || staff || '';
    };

    const handleNavigateToClient = (event = {}) => {
        const clientId = event.user || event.user_id;
        if (clientId) {
            navigate(`/firmadmin/clients/${clientId}`);
        } else {
            navigate('/firmadmin/clients');
        }
    };

    const handleNavigateToStaff = (event = {}) => {
        const staffId = event.appointment_with || event.staff_id;
        if (staffId) {
            navigate(`/firmadmin/staff/${staffId}`);
        } else {
            navigate('/firmadmin/staff');
        }
    };

    const renderParticipantButtons = (event = {}) => {
        const hasClient = Boolean(event.user_name);
        const hasStaff = Boolean(event.appointment_with_name);
        if (!hasClient && !hasStaff) return null;

        return (
            <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-1">
                {hasClient && (
                    <button
                        type="button"
                        className="text-blue-600 hover:underline"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNavigateToClient(event);
                        }}
                    >
                        {event.user_name}
                    </button>
                )}
                {hasClient && hasStaff && <span> with </span>}
                {hasStaff && (
                    <button
                        type="button"
                        className="text-blue-600 hover:underline"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNavigateToStaff(event);
                        }}
                    >
                        {event.appointment_with_name}
                    </button>
                )}
            </div>
        );
    };

    const isSameCalendarDay = (dateA, dateB) => {
        if (!dateA || !dateB) return false;
        return (
            dateA.getFullYear() === dateB.getFullYear() &&
            dateA.getMonth() === dateB.getMonth() &&
            dateA.getDate() === dateB.getDate()
        );
    };

    const formatReadableDate = (dateObj) => {
        if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return '';
        return dateObj.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const openEventsModal = (dateObj, events = []) => {
        setEventsModal({
            open: true,
            dateLabel: formatReadableDate(dateObj),
            events
        });
    };

    const closeEventsModal = () => {
        setEventsModal((prev) => ({ ...prev, open: false }));
    };

    // Helper function to get appointments for a specific date
    const getAppointmentsForDate = (dateInput) => {
        if (!dateInput) return [];
        const dateObj = dateInput instanceof Date
            ? dateInput
            : new Date(currentDate.getFullYear(), currentDate.getMonth(), Number(dateInput));
        const dateStr = formatDateKey(dateObj);
        const events = appointmentsByDate[dateStr] || [];
        return [...events].sort((a, b) => (a.timeSort || 0) - (b.timeSort || 0));
    };

    // Format date to YYYY-MM-DD format
    const formatDateForAPI = (dateStr) => {
        if (!dateStr) return '';
        // Handle different date formats: MM/DD/YYYY, DD-MM-YYYY, YYYY-MM-DD
        const formats = [
            /^(\d{2})\/(\d{2})\/(\d{4})$/,  // MM/DD/YYYY
            /^(\d{2})-(\d{2})-(\d{4})$/,   // DD-MM-YYYY
            /^(\d{4})-(\d{2})-(\d{2})$/    // YYYY-MM-DD
        ];

        for (const format of formats) {
            const match = dateStr.match(format);
            if (match) {
                if (format === formats[0]) {
                    // MM/DD/YYYY
                    return `${match[3]}-${match[1]}-${match[2]}`;
                } else if (format === formats[1]) {
                    // DD-MM-YYYY
                    return `${match[3]}-${match[2]}-${match[1]}`;
                } else {
                    // YYYY-MM-DD
                    return dateStr;
                }
            }
        }
        return dateStr;
    };

    // Format time to HH:MM:SS format (backend expects seconds)
    const formatTimeForAPI = (timeStr) => {
        if (!timeStr) return '';
        // Remove AM/PM if present and convert to 24-hour
        const isPM = timeStr.toUpperCase().includes('PM');
        const isAM = timeStr.toUpperCase().includes('AM');

        let time = timeStr.replace(/\s*(AM|PM)\s*/i, '').trim();
        const parts = time.split(':');

        if (parts.length >= 2) {
            let hours = parseInt(parts[0], 10);
            const minutes = parts[1] || '00';

            if (isPM && hours !== 12) hours += 12;
            if (isAM && hours === 12) hours = 0;

            // Return in HH:MM:SS format (backend expects seconds)
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
        }

        // If already in HH:MM format, add :00 seconds
        if (timeStr.match(/^\d{2}:\d{2}$/)) {
            return `${timeStr}:00`;
        }

        return timeStr;
    };

    // Handle time slot changes
    const handleTimeSlotChange = (id, field, value) => {
        setSlots(prev => prev.map(slot =>
            slot.id === id
                ? { ...slot, [field]: field === 'client_id' ? parseInt(value) || '' : value }
                : slot
        ));
    };

    // Add time slot
    const addTimeSlot = () => {
        const newId = Math.max(...slots.map(slot => slot.id), 0) + 1;
        setSlots(prev => [...prev, {
            id: newId,
            time: '09:00',
            client_id: ''
        }]);
    };

    // Remove time slot
    const removeTimeSlot = (id) => {
        if (slots.length > 1) {
            setSlots(prev => prev.filter(slot => slot.id !== id));
        }
    };

    // Reset event form
    const resetEventForm = () => {
        setEventTitle('');
        setAppointmentDuration(30);
        setTimezone('America/New_York');
        setAppointmentDate('');
        setSlots([{ id: 1, time: '09:00', client_id: '' }]);
        setMeetingType('zoom');
        setDescription('');
        setAssignedStaffId('');
    };

    // Handle create meeting - updated to match tax preparer modal structure
    const handleCreateMeeting = async () => {
        // Validation
        if (!eventTitle.trim()) {
            toast.error('Please enter event title', {
                position: 'top-right',
                autoClose: 3000
            });
            return;
        }

        if (!appointmentDate) {
            toast.error('Please select a date', {
                position: 'top-right',
                autoClose: 3000
            });
            return;
        }

        // Validate slots - at least one slot with time and client
        const validSlots = slots.filter(slot => slot.time && slot.client_id);
        if (validSlots.length === 0) {
            toast.error('Please add at least one time slot with a client', {
                position: 'top-right',
                autoClose: 3000
            });
            return;
        }

        // Validate staff assignment
        if (!assignedStaffId) {
            toast.error('Please assign a staff member', {
                position: 'top-right',
                autoClose: 3000
            });
            return;
        }

        try {
            setCreatingMeeting(true);

            // Create meeting for each slot
            // For now, we'll create the first meeting and handle overlaps
            // TODO: Handle multiple slots if needed (might need different API structure)
            const firstSlot = validSlots[0];

            const meetingData = {
                event_title: eventTitle,
                event_type: 'consultation', // Default event type
                date: formatDateForAPI(appointmentDate),
                time: formatTimeForAPI(firstSlot.time),
                duration: appointmentDuration || 30,
                location: '', // Location can be added later
                description: description || '',
                meeting_type: meetingType || 'zoom',
                client_id: firstSlot.client_id,
                staff_id: parseInt(assignedStaffId), // Required staff assignment
                timezone: timezone || 'America/New_York'
            };

            const response = await firmAdminMeetingsAPI.createMeeting(meetingData);

            // Handle different response statuses
            if (response.status === 201 && response.success) {
                // Success - meeting created
                toast.success(response.message || 'Meeting created successfully', {
                    position: 'top-right',
                    autoClose: 3000
                });

                // Reset form and close modal
                resetEventForm();
                setIsAddEventModalOpen(false);

                // Refresh calendar data
                await fetchCalendarData();
            } else if (response.status === 409 && response.has_overlap) {
                // Overlap detected - show warning modal
                setOverlappingAppointments(response.overlapping_appointments || []);
                setNewAppointmentDetails(response.new_appointment_details || meetingData);
                setShowOverlapModal(true);
            } else if (response.status === 400) {
                // Validation error - format user-friendly messages
                const errors = response.errors || {};
                let userFriendlyMessage = response.message || 'Please check your input and try again.';
                
                // Handle non_field_errors (general errors)
                if (errors.non_field_errors) {
                    const nonFieldErrors = Array.isArray(errors.non_field_errors) 
                        ? errors.non_field_errors 
                        : [errors.non_field_errors];
                    
                    // Format non-field errors in user-friendly way
                    const formattedNonFieldErrors = nonFieldErrors.map(err => {
                        // Handle specific error messages
                        if (typeof err === 'string') {
                            // Remove technical prefixes and format dates nicely
                            let formatted = err
                                .replace(/^non_field_errors:\s*/i, '')
                                .replace(/Staff member is not available on\s+(\d{4}-\d{2}-\d{2})/i, (match, date) => {
                                    // Format date nicely
                                    const dateObj = new Date(date);
                                    const formattedDate = dateObj.toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    });
                                    return `The selected staff member is not available on ${formattedDate}`;
                                });
                            return formatted;
                        }
                        return err;
                    });
                    
                    userFriendlyMessage = formattedNonFieldErrors.join('. ');
                } else {
                    // Handle field-specific errors
                    const fieldErrors = Object.entries(errors)
                        .filter(([field]) => field !== 'non_field_errors')
                        .map(([field, msgs]) => {
                            const messages = Array.isArray(msgs) ? msgs : [msgs];
                            // Convert field names to user-friendly labels
                            const fieldLabel = field
                                .replace(/_/g, ' ')
                                .replace(/\b\w/g, l => l.toUpperCase());
                            return `${fieldLabel}: ${messages.join(', ')}`;
                        });
                    
                    if (fieldErrors.length > 0) {
                        userFriendlyMessage = fieldErrors.join('. ');
                    }
                }

                toast.error(userFriendlyMessage, {
                    position: 'top-right',
                    autoClose: 5000
                });
            } else {
                // Other error
                toast.error(response.message || handleAPIError(new Error('Failed to create meeting')), {
                    position: 'top-right',
                    autoClose: 3000
                });
            }
        } catch (error) {
            console.error('Error creating meeting:', error);
            
            // Try to extract user-friendly error from error response
            let errorMessage = 'Failed to create meeting';
            
            if (error.response) {
                const errorData = error.response.data || error.response;
                if (errorData.errors) {
                    const errors = errorData.errors;
                    
                    // Handle non_field_errors
                    if (errors.non_field_errors) {
                        const nonFieldErrors = Array.isArray(errors.non_field_errors) 
                            ? errors.non_field_errors 
                            : [errors.non_field_errors];
                        
                        const formattedErrors = nonFieldErrors.map(err => {
                            if (typeof err === 'string') {
                                return err
                                    .replace(/^non_field_errors:\s*/i, '')
                                    .replace(/Staff member is not available on\s+(\d{4}-\d{2}-\d{2})/i, (match, date) => {
                                        const dateObj = new Date(date);
                                        const formattedDate = dateObj.toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        });
                                        return `The selected staff member is not available on ${formattedDate}`;
                                    });
                            }
                            return err;
                        });
                        
                        errorMessage = formattedErrors.join('. ');
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            toast.error(errorMessage, {
                position: 'top-right',
                autoClose: 5000
            });
        } finally {
            setCreatingMeeting(false);
        }
    };

    // Handle confirm overwrite
    const handleConfirmOverwrite = async () => {
        if (!newAppointmentDetails) return;

        try {
            setConfirmingOverwrite(true);

            // Ensure staff_id is included in overwrite data
            const overwriteData = {
                confirm_overwrite: true,
                appointment_ids_to_cancel: overlappingAppointments.map(apt => apt.id),
                ...newAppointmentDetails,
                staff_id: newAppointmentDetails.staff_id || parseInt(assignedStaffId)
            };

            const response = await firmAdminMeetingsAPI.confirmOverwrite(overwriteData);

            if (response.success) {
                toast.success(response.message || 'Meeting created successfully. Overlapping meetings cancelled.', {
                    position: 'top-right',
                    autoClose: 4000
                });

                // Close modals and reset form
                setShowOverlapModal(false);
                resetEventForm();
                setIsAddEventModalOpen(false);

                // Refresh calendar data
                await fetchCalendarData();
            } else {
                // Handle validation errors in overwrite response
                const errors = response.errors || {};
                let errorMessage = response.message || 'Failed to create meeting';
                
                if (errors.non_field_errors) {
                    const nonFieldErrors = Array.isArray(errors.non_field_errors) 
                        ? errors.non_field_errors 
                        : [errors.non_field_errors];
                    
                    const formattedErrors = nonFieldErrors.map(err => {
                        if (typeof err === 'string') {
                            return err
                                .replace(/^non_field_errors:\s*/i, '')
                                .replace(/Staff member is not available on\s+(\d{4}-\d{2}-\d{2})/i, (match, date) => {
                                    const dateObj = new Date(date);
                                    const formattedDate = dateObj.toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    });
                                    return `The selected staff member is not available on ${formattedDate}`;
                                });
                        }
                        return err;
                    });
                    
                    errorMessage = formattedErrors.join('. ');
                }
                
                toast.error(errorMessage, {
                    position: 'top-right',
                    autoClose: 5000
                });
            }
        } catch (error) {
            console.error('Error confirming overwrite:', error);
            
            // Try to extract user-friendly error from error response
            let errorMessage = 'Failed to create meeting';
            
            if (error.response) {
                const errorData = error.response.data || error.response;
                if (errorData.errors?.non_field_errors) {
                    const nonFieldErrors = Array.isArray(errorData.errors.non_field_errors) 
                        ? errorData.errors.non_field_errors 
                        : [errorData.errors.non_field_errors];
                    
                    const formattedErrors = nonFieldErrors.map(err => {
                        if (typeof err === 'string') {
                            return err
                                .replace(/^non_field_errors:\s*/i, '')
                                .replace(/Staff member is not available on\s+(\d{4}-\d{2}-\d{2})/i, (match, date) => {
                                    const dateObj = new Date(date);
                                    const formattedDate = dateObj.toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    });
                                    return `The selected staff member is not available on ${formattedDate}`;
                                });
                        }
                        return err;
                    });
                    
                    errorMessage = formattedErrors.join('. ');
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            toast.error(errorMessage, {
                position: 'top-right',
                autoClose: 5000
            });
        } finally {
            setConfirmingOverwrite(false);
        }
    };

    // Metric cards data (now using API statistics)
    const metricCards = [
        {
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 2V6" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 2V6" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 10H21" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            value: statistics.scheduled_month.toString(),
            label: 'Scheduled (month)'
        },
        {
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            value: statistics.completed.toString(),
            label: 'Completed'
        },
        {
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M9 1.25C7.74022 1.25 6.53204 1.75044 5.64124 2.64124C4.75045 3.53204 4.25 4.74022 4.25 6C4.25 7.25978 4.75045 8.46796 5.64124 9.35876C6.53204 10.2496 7.74022 10.75 9 10.75C10.2598 10.75 11.468 10.2496 12.3588 9.35876C13.2496 8.46796 13.75 7.25978 13.75 6C13.75 4.74022 13.2496 3.53204 12.3588 2.64124C11.468 1.75044 10.2598 1.25 9 1.25ZM5.75 6C5.75 5.13805 6.09241 4.3114 6.7019 3.7019C7.3114 3.09241 8.13805 2.75 9 2.75C9.86195 2.75 10.6886 3.09241 11.2981 3.7019C11.9076 4.3114 12.25 5.13805 12.25 6C12.25 6.86195 11.9076 7.6886 11.2981 8.2981C10.6886 8.90759 9.86195 9.25 9 9.25C8.13805 9.25 7.3114 8.90759 6.7019 8.2981C6.09241 7.6886 5.75 6.86195 5.75 6Z" fill="#00C0C6" />
                    <path d="M15 2.25C14.8011 2.25 14.6103 2.32902 14.4697 2.46967C14.329 2.61032 14.25 2.80109 14.25 3C14.25 3.19891 14.329 3.38968 14.4697 3.53033C14.6103 3.67098 14.8011 3.75 15 3.75C15.5967 3.75 16.169 3.98705 16.591 4.40901C17.0129 4.83097 17.25 5.40326 17.25 6C17.25 6.59674 17.0129 7.16903 16.591 7.59099C16.169 8.01295 15.5967 8.25 15 8.25C14.8011 8.25 14.6103 8.32902 14.4697 8.46967C14.329 8.61032 14.25 8.80109 14.25 9C14.25 9.19891 14.329 9.38968 14.4697 9.53033C14.6103 9.67098 14.8011 9.75 15 9.75C15.9946 9.75 16.9484 9.35491 17.6517 8.65165C18.3549 7.94839 18.75 6.99456 18.75 6C18.75 5.00544 18.3549 4.05161 17.6517 3.34835C16.9484 2.64509 15.9946 2.25 15 2.25Z" fill="#00C0C6" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M3.678 13.52C5.078 12.72 6.961 12.25 9 12.25C11.039 12.25 12.922 12.72 14.322 13.52C15.7 14.308 16.75 15.51 16.75 17C16.75 18.49 15.7 19.692 14.322 20.48C12.922 21.28 11.039 21.75 9 21.75C6.961 21.75 5.078 21.28 3.678 20.48C2.3 19.692 1.25 18.49 1.25 17C1.25 15.51 2.3 14.308 3.678 13.52ZM4.422 14.823C3.267 15.483 2.75 16.28 2.75 17C2.75 17.72 3.267 18.517 4.422 19.177C5.556 19.825 7.173 20.25 9 20.25C10.827 20.25 12.444 19.825 13.578 19.177C14.733 18.517 15.25 17.719 15.25 17C15.25 16.281 14.733 15.483 13.578 14.823C12.444 14.175 10.827 13.75 9 13.75C7.173 13.75 5.556 14.175 4.422 14.823Z" fill="#00C0C6" />
                    <path d="M18.1598 13.2673C17.9654 13.2248 17.7621 13.2614 17.5946 13.3688C17.4271 13.4763 17.3092 13.6459 17.2668 13.8403C17.2243 14.0347 17.2609 14.238 17.3683 14.4054C17.4758 14.5729 17.6454 14.6908 17.8398 14.7333C18.6318 14.9063 19.2648 15.2053 19.6828 15.5473C20.1008 15.8893 20.2498 16.2243 20.2498 16.5003C20.2498 16.7503 20.1298 17.0453 19.7968 17.3543C19.4618 17.6653 18.9468 17.9523 18.2838 18.1523C18.1894 18.1806 18.1016 18.2273 18.0253 18.2896C17.9489 18.3519 17.8856 18.4287 17.839 18.5154C17.7923 18.6022 17.7632 18.6973 17.7533 18.7954C17.7434 18.8934 17.7529 18.9924 17.7813 19.0868C17.8096 19.1811 17.8563 19.269 17.9186 19.3453C17.9809 19.4216 18.0577 19.4849 18.1445 19.5316C18.2312 19.5782 18.3263 19.6073 18.4244 19.6172C18.5224 19.6271 18.6214 19.6176 18.7158 19.5893C19.5388 19.3413 20.2738 18.9583 20.8178 18.4533C21.3638 17.9463 21.7498 17.2793 21.7498 16.5003C21.7498 15.6353 21.2758 14.9123 20.6328 14.3863C19.9888 13.8593 19.1218 13.4783 18.1598 13.2673Z" fill="#00C0C6" />
                </svg>
            ),
            value: `${statistics.no_show_rate}%`,
            label: 'No-show rate'
        },
        {
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 13.0012L21.223 16.4832C21.2983 16.5333 21.3858 16.5621 21.4761 16.5664C21.5664 16.5707 21.6563 16.5505 21.736 16.5078C21.8157 16.4651 21.8824 16.4016 21.9289 16.324C21.9754 16.2464 22 16.1577 22 16.0672V7.87124C22 7.78326 21.9768 7.69684 21.9328 7.62069C21.8887 7.54454 21.8253 7.48136 21.7491 7.43754C21.6728 7.39372 21.5863 7.3708 21.4983 7.3711C21.4103 7.3714 21.324 7.3949 21.248 7.43924L16 10.5012" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 6H4C2.89543 6 2 6.89543 2 8V16C2 17.1046 2.89543 18 4 18H14C15.1046 18 16 17.1046 16 16V8C16 6.89543 15.1046 6 14 6Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            value: statistics.avg_duration_display,
            label: 'Avg. duration'
        }
    ];

    // Navigation tabs
    const navTabs = ['Calendar', 'Appointments', 'Features', 'Staff'];

    // View mode tabs
    const viewTabs = ['Day', 'Week', 'Monthly', 'Years', 'Agenda'];

    // Get days in month (returns Date objects for 6-week grid)
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = [];

        const firstDayOfWeek = new Date(year, month, 1).getDay();
        for (let i = firstDayOfWeek; i > 0; i--) {
            days.push(new Date(year, month, 1 - i));
        }

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        while (days.length < 42) {
            const lastDate = days[days.length - 1];
            days.push(new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate() + 1));
        }

        return days;
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const navigateMonth = (direction) => {
        setUserAdjustedDate(true);
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    };

    const navigateDay = (direction) => {
        setUserAdjustedDate(true);
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + direction));
    };

    const navigateWeek = (direction) => {
        setUserAdjustedDate(true);
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + (direction * 7)));
    };

    const navigateYear = (direction) => {
        setUserAdjustedDate(true);
        setCurrentDate(new Date(currentDate.getFullYear() + direction, currentDate.getMonth(), 1));
    };

    const goToToday = () => {
        setUserAdjustedDate(false);
        if (highlightDate) {
            setCurrentDate(new Date(highlightDate));
        } else {
            setCurrentDate(new Date());
        }
    };

    // Get week days
    const getWeekDays = (date) => {
        const startOfWeek = new Date(date);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day;
        const weekStart = new Date(startOfWeek.setDate(diff));

        const days = [];
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(weekStart);
            currentDay.setDate(weekStart.getDate() + i);
            const today = new Date();
            days.push({
                date: currentDay.getDate(),
                month: currentDay.getMonth(),
                year: currentDay.getFullYear(),
                isToday: currentDay.getDate() === today.getDate() &&
                    currentDay.getMonth() === today.getMonth() &&
                    currentDay.getFullYear() === today.getFullYear(),
                dayName: dayNames[currentDay.getDay()]
            });
        }
        return days;
    };

    // Get year months
    const getYearMonths = (year) => {
        return monthNames.map((month, index) => ({
            name: month,
            index: index,
            year: year
        }));
    };

    const calendarDays = getDaysInMonth(currentDate);
    const weekDays = getWeekDays(currentDate);
    const yearMonths = getYearMonths(currentDate.getFullYear());
    const currentMonthName = monthNames[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear();
    const currentDay = currentDate.getDate();

    return (
        <div className="min-h-screen bg-[#F3F7FF] p-6">
            <div className="mx-auto">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-6">
                        <div>
                            <h4 className="text-2xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Firm Calendar</h4>
                            <p className="text-gray-600 font-[BasisGrotesquePro]">Manage appointments, deadlines, and meetings</p>
                        </div>
                        <div className="flex items-center gap-3 mt-4 lg:mt-0">
                            {/* <button
                                onClick={() => setIsSetAvailabilityModalOpen(true)}
                                className="px-4 py-2 bg-white border border-[#E8F0FF] text-[#3B4A66] !rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-[BasisGrotesquePro]"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Set Availability
                            </button> */}
                            <button
                                onClick={() => setIsAddEventModalOpen(true)}
                                className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors flex items-center gap-2 font-[BasisGrotesquePro]"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Event
                            </button>
                        </div>
                    </div>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {metricCards.map((card, index) => (
                            <div key={index} className="bg-white !rounded-lg !border border-[#E8F0FF] pt-6 px-4 pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col">
                                        <div className="text-[#3AD6F2] mb-2">{card.icon}</div>
                                        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-4">{card.label}</p>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] leading-none">{card.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Navigation Tabs and Event Filters */}
                    <div className="flex flex-col lg:flex-row justify-between mb-6 items-start">
                        {/* Navigation Tabs - Left Side */}
                        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-2">
                            <div className="flex gap-2">
                                {navTabs.map((tab) => {
                                    const tabPath = tab === 'Calendar' ? '/firmadmin/calendar' : `/firmadmin/calendar/${tab.toLowerCase()}`;
                                    
                                    return (
                                        <Link
                                            key={tab}
                                            to={tabPath}
                                            className={`px-4 py-2 font-[BasisGrotesquePro] transition-colors !rounded-lg ${
                                                activeTab === tab
                                                    ? 'bg-[#3AD6F2] !text-white font-semibold'
                                                    : 'bg-transparent hover:bg-gray-50 !text-black'
                                            }`}
                                        >
                                            {tab}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Event Filters - Right Side */}
                        <div className="flex flex-col sm:flex-row gap-2 mt-2 lg:mt-0">
                            <div className="w-full sm:w-auto">
                                {/* <div className="relative">
                                    <select
                                        value={calendarType}
                                        onChange={(e) => setCalendarType(e.target.value)}
                                        className="w-full sm:w-[150px] appearance-none bg-white !border border-[#E8F0FF] !rounded-lg px-3 py-2 pr-10 text-gray-700 focus:outline-none font-[BasisGrotesquePro] cursor-pointer"
                                    >
                                        <option>Firm Calendar</option>
                                        <option>Personal Calendar</option>
                                        <option>Team Calendar</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div> */}
                            </div>
                        </div>
                    </div>

                    {/* External Calendar Sync */}
                    {/* <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]">External Calendar Sync</h4>
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-900 mb-1 font-[BasisGrotesquePro]">Provider</label>
                                <div className="relative">
                                    <select
                                        value={provider}
                                        onChange={(e) => setProvider(e.target.value)}
                                        className="w-full appearance-none bg-white !border border-[#E8F0FF] rounded-lg px-4 py-2 pr-10 text-gray-700 focus:outline-none font-[BasisGrotesquePro] cursor-pointer"
                                    >
                                        <option>Google Calendar</option>
                                        <option>Outlook Calendar</option>
                                        <option>Apple Calendar</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-900 mb-1 font-[BasisGrotesquePro]">Direction</label>
                                <div className="relative">
                                    <select
                                        value={direction}
                                        onChange={(e) => setDirection(e.target.value)}
                                        className="w-full appearance-none bg-white !border border-[#E8F0FF] !rounded-lg px-4 py-2 pr-10 text-gray-700 focus:outline-none font-[BasisGrotesquePro] cursor-pointer"
                                    >
                                        <option>One-way (Pull)</option>
                                        <option>One-way (Push)</option>
                                        <option>Two-way</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] whitespace-nowrap">
                                Sync Now
                            </button>
                        </div>
                    </div> */}
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Calendar Section */}
                    <div className="flex-1">
                        {/* View Controls */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                            {viewTabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setViewMode(tab)}
                                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-[BasisGrotesquePro] transition-colors !rounded-lg ${viewMode === tab
                                        ? 'bg-[#F56D2D] text-white'
                                        : 'bg-white !border border-[#E8F0FF] text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        {/* Dynamic Navigation */}
                        <div className="sm:p-4 mb-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <h5 className="text-lg sm:text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                                    {viewMode === 'Day' && `${dayNames[currentDate.getDay()]}, ${currentMonthName} ${currentDay}, ${currentYear}`}
                                    {viewMode === 'Week' && `Week of ${currentMonthName} ${weekDays[0].date}, ${currentYear}`}
                                    {viewMode === 'Monthly' && `${currentMonthName} ${currentYear}`}
                                    {viewMode === 'Years' && `${currentYear}`}
                                    {viewMode === 'Agenda' && `Agenda - ${currentMonthName} ${currentYear}`}
                                </h5>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            if (viewMode === 'Day') navigateDay(-1);
                                            else if (viewMode === 'Week') navigateWeek(-1);
                                            else if (viewMode === 'Years') navigateYear(-1);
                                            else navigateMonth(-1);
                                        }}
                                        className="px-2 sm:px-3 py-2 bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={goToToday}
                                        className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-white !border border-[#E8F0FF] rounded-lg hover:bg-gray-50 font-[BasisGrotesquePro] transition-colors text-gray-600"
                                    >
                                        Today
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (viewMode === 'Day') navigateDay(1);
                                            else if (viewMode === 'Week') navigateWeek(1);
                                            else if (viewMode === 'Years') navigateYear(1);
                                            else navigateMonth(1);
                                        }}
                                        className="px-2 sm:px-3 py-2 bg-white !border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Calendar Views */}
                        <div className="bg-white rounded-lg !border border-[#E8F0FF] p-2 sm:p-4 lg:p-6 overflow-x-auto">
                            {viewMode === 'Day' && (
                                <div className="min-h-[400px]">
                                    <div className="text-center mb-4">
                                        <h5 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">{currentDay}</h5>
                                        <p className="text-gray-600 font-[BasisGrotesquePro]">{dayNames[currentDate.getDay()]}, {currentMonthName} {currentYear}</p>
                                    </div>
                                    <div className="space-y-2">
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <div key={i} className="flex items-center border-b border-[#E8F0FF] py-2">
                                                <div className="w-20 text-sm text-gray-600 font-[BasisGrotesquePro]">{String(i).padStart(2, '0')}:00</div>
                                                <div className="flex-1">
                                                    {i === 6 && currentDay === 21 && currentDate.getMonth() === 6 && currentDate.getFullYear() === 2025 && (
                                                        <div className="bg-[#FFF5E0] border border-[#FFE0B2] rounded-lg px-2 py-1.5 flex items-start gap-2">
                                                            <div className="w-2 h-2 bg-[#F56D2D] rounded-full mt-1.5 flex-shrink-0"></div>
                                                            <div>
                                                                <div className="text-xs text-gray-900 font-[BasisGrotesquePro]">Schedule a free Phone...</div>
                                                                <div className="text-xs font-[BasisGrotesquePro]" style={{ color: '#00C0C6' }}>06:00 - 08:00</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {viewMode === 'Week' && (
                                <div className="grid grid-cols-7 gap-0.5 sm:gap-1 min-w-[600px]">
                                    {dayNames.map((day) => (
                                        <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-700 py-1 sm:py-2 font-[BasisGrotesquePro] border-b border-[#E8F0FF]">
                                            {day}
                                        </div>
                                    ))}
                                    {weekDays.map((day, index) => {
                                        const dateObj = new Date(day.year, day.month, day.date);
                                        const dayAppointments = getAppointmentsForDate(dateObj);
                                        const hasAppointments = dayAppointments.length > 0;
                                        const isHighlighted =
                                            highlightDate ? isSameCalendarDay(dateObj, highlightDate) : day.isToday;
                                        const weekCellClasses = [
                                            'min-h-[300px] p-2 border rounded-lg transition-colors duration-150',
                                            isHighlighted ? 'bg-blue-50 border-blue-300' : 'border-[#E8F0FF]',
                                            hasAppointments && !day.isToday ? 'bg-[#FFF7ED] border-[#F56D2D]' : '',
                                        ].join(' ');

                                        const topEventTime = hasAppointments ? getEventTimeRange(dayAppointments[0]) : '';

                                        return (
                                            <div key={index} className={weekCellClasses}>
                                                <div className="mb-2 flex justify-end">
                                                    <span
                                                        className={[
                                                            'w-6 h-6 flex items-center justify-center rounded-full text-sm font-[BasisGrotesquePro]',
                                                            isHighlighted
                                                                ? 'bg-blue-100 text-blue-700 font-bold'
                                                                : hasAppointments
                                                                    ? 'bg-[#F56D2D] text-white font-semibold'
                                                                    : 'text-gray-900',
                                                        ].join(' ')}
                                                    >
                                                        {day.date}
                                                    </span>
                                                </div>
                                                {topEventTime && (
                                                    <div className="text-[11px] text-[#00C0C6] font-[BasisGrotesquePro] text-right mb-1 whitespace-nowrap">
                                                        {topEventTime}
                                                    </div>
                                                )}
                                                {hasAppointments &&
                                                    dayAppointments.slice(0, 3).map((appointment, idx) => (
                                                        <div key={idx} className="bg-white/80 border border-[#FFE0B2] rounded-lg px-2 py-1.5 flex items-start gap-2 mb-1 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                                                            <div className="w-2 h-2 bg-[#F56D2D] rounded-full mt-1.5 flex-shrink-0"></div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs text-gray-900 font-[BasisGrotesquePro]">{appointment.subject || 'Appointment'}</div>
                                                                <div className="text-xs font-[BasisGrotesquePro]" style={{ color: '#00C0C6' }}>
                                                                    {formatTime(appointment.appointment_time)}{' '}
                                                                    {appointment.end_time ? `- ${formatTime(appointment.end_time)}` : appointment.appointment_duration ? `(${appointment.appointment_duration}m)` : ''}
                                                                </div>
                                                                {getEventParticipants(appointment) && (
                                                                    <div className="text-[11px] text-gray-500 font-[BasisGrotesquePro]">
                                                                        {getEventParticipants(appointment)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                {dayAppointments.length > 3 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEventsModal(dateObj, dayAppointments)}
                                                        className="w-full mt-1 text-xs text-[#F56D2D] font-[BasisGrotesquePro] text-center flex items-center justify-center gap-1 hover:underline"
                                                    >
                                                        View {dayAppointments.length - 3} more <span aria-hidden="true">➔</span>
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {viewMode === 'Monthly' && (
                                <div className="border border-[#E8F0FF] rounded-lg overflow-hidden min-w-[600px]">
                                    <div className="grid grid-cols-7">
                                        {dayNames.map((day) => (
                                            <div
                                                key={day}
                                                className="text-center text-xs sm:text-sm font-semibold text-gray-700 py-1 sm:py-2 font-[BasisGrotesquePro] border-b border-[#E8F0FF] border-r border-[#E8F0FF] last:border-r-0 bg-white"
                                            >
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7">
                                        {calendarDays.map((day, index) => {
                                            const dayAppointments = getAppointmentsForDate(day);
                                            const isCurrentMonth =
                                                day.getMonth() === currentDate.getMonth() &&
                                                day.getFullYear() === currentDate.getFullYear();
                                            const isHighlighted = highlightDate
                                                ? isSameCalendarDay(day, highlightDate)
                                                : isSameCalendarDay(day, new Date());

                                            return (
                                                <div
                                                    key={index}
                                                    className={`min-h-[100px] p-2 sm:p-3 border-r border-b border-[#E8F0FF] transition-colors ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                                                        } ${(index + 1) % 7 === 0 ? 'border-r-0' : ''}`}
                                                >
                                                    <div
                                                        className={`text-sm font-medium mb-1 ${isHighlighted
                                                            ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center'
                                                            : ''
                                                            }`}
                                                    >
                                                        {day.getDate()}
                                                    </div>
                                                    {dayAppointments.map((event, idx) => (
                                                        <div
                                                            key={`${event.id || idx}-${event.appointment_time || idx}`}
                                                            className={`${getEventChipClasses(
                                                                event.appointment_status
                                                            )} text-xs p-1 rounded mb-1 shadow-sm cursor-pointer hover:opacity-90`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openEventsModal(day, dayAppointments);
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                <div className="w-1 h-1 bg-white rounded-full"></div>
                                                                <span className="truncate">
                                                                    {event.subject || event.title || 'Meeting'}
                                                                </span>
                                                            </div>
                                                            <div className="text-[10px] opacity-90">
                                                                {getEventTimeRange(event)}
                                                            </div>
                                                            {getEventParticipants(event) && (
                                                                <div className="text-[10px] opacity-80">
                                                                    {getEventParticipants(event)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {viewMode === 'Years' && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                    {yearMonths.map((month, index) => (
                                        <div key={index} className="p-4 border border-[#E8F0FF] rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <h6 className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro] mb-2">{month.name}</h6>
                                            <div className="text-xs text-gray-500 font-[BasisGrotesquePro]">{month.year}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {viewMode === 'Agenda' && (
                                <div className="space-y-4">
                                    <div className="border-b border-[#E8F0FF] pb-2 mb-4">
                                        <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro]">{currentMonthName} {currentYear}</h5>
                                    </div>
                                    <div className="space-y-3">
                                        {(() => {
                                            // Get all appointments for the current month
                                            const monthAppointments = [];
                                            const year = currentDate.getFullYear();
                                            const month = currentDate.getMonth() + 1;

                                            Object.keys(appointmentsByDate).forEach(dateStr => {
                                                const [y, m] = dateStr.split('-').map(Number);
                                                if (y === year && m === month) {
                                                    appointmentsByDate[dateStr].forEach(apt => {
                                                        monthAppointments.push({
                                                            ...apt,
                                                            date: dateStr
                                                        });
                                                    });
                                                }
                                            });

                                            // Sort by date and time
                                            monthAppointments.sort((a, b) => {
                                                if (a.date !== b.date) return a.date.localeCompare(b.date);
                                                return (a.appointment_time || '').localeCompare(b.appointment_time || '');
                                            });

                                            if (monthAppointments.length === 0) {
                                                return (
                                                    <div className="text-sm text-gray-500 font-[BasisGrotesquePro] text-center py-4">
                                                        No events this month
                                                    </div>
                                                );
                                            }

                                            // Group by date
                                            const groupedByDate = {};
                                            monthAppointments.forEach(apt => {
                                                if (!groupedByDate[apt.date]) {
                                                    groupedByDate[apt.date] = [];
                                                }
                                                groupedByDate[apt.date].push(apt);
                                            });

                                            return Object.keys(groupedByDate).map(dateStr => {
                                                const [y, m, d] = dateStr.split('-').map(Number);
                                                const monthName = monthNames[m - 1].substring(0, 3);
                                                const appointments = groupedByDate[dateStr];

                                                return (
                                                    <div key={dateStr}>
                                                        {appointments.map((appointment, idx) => (
                                                            <div key={idx} className="flex items-start gap-3 p-3 border border-[#E8F0FF] rounded-lg mb-2">
                                                                <div className="w-16 text-sm text-gray-600 font-[BasisGrotesquePro]">{monthName} {d}</div>
                                                                <div className="flex-1">
                                                                    <div className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">
                                                                        {appointment.subject || 'Appointment'}
                                                                    </div>
                                                                    <div className="text-xs font-[BasisGrotesquePro]" style={{ color: '#00C0C6' }}>
                                                                        {formatTime(appointment.appointment_time)} {appointment.end_time ? `- ${formatTime(appointment.end_time)}` : (appointment.appointment_duration ? `(${appointment.appointment_duration}m)` : '')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="w-full lg:w-80 space-y-4">
                        {/* Today's Events */}
                        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 mt-17">
                            <h6 className="text-lg font-semibold text-gray-900 mb-1 font-[BasisGrotesquePro]">Today's Events</h6>
                            <p className="text-sm text-gray-500 mb-4 font-[BasisGrotesquePro]">{todayEvents.date_display || 'N/A'}</p>
                            {loading ? (
                                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] text-center">Loading...</p>
                            ) : todayEvents.count === 0 ? (
                                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] text-center">No events scheduled for today</p>
                            ) : (
                                <div className="space-y-2">
                                    {todayEvents.events.map((event, index) => (
                                        <div key={index} className="bg-[#FFF5E0] border border-[#FFE0B2] rounded-lg px-2 py-1.5">
                                            <div className="text-xs font-medium text-gray-900 font-[BasisGrotesquePro] mb-0.5">
                                                {event.subject || 'Event'}
                                            </div>
                                            <div className="text-xs font-[BasisGrotesquePro]" style={{ color: '#00C0C6' }}>
                                                {formatTime(event.appointment_time)} - {formatTime(event.end_time || (event.appointment_time && (() => {
                                                    const [hours, minutes] = event.appointment_time.split(':');
                                                    const duration = event.appointment_duration || 30;
                                                    const totalMinutes = parseInt(hours) * 60 + parseInt(minutes) + duration;
                                                    const endHours = Math.floor(totalMinutes / 60) % 24;
                                                    const endMins = totalMinutes % 60;
                                                    return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00`;
                                                })()))}
                                            </div>
                                            {getEventParticipants(event) && (
                                                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-0.5">
                                                    {getEventParticipants(event)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Upcoming Events */}
                        <div className="bg-white rounded-lg !border border-[#E8F0FF] p-4">
                            <h6 className="text-lg font-semibold text-gray-900 mb-1 font-[BasisGrotesquePro]">Upcoming Events</h6>
                            <p className="text-sm text-gray-500 mb-4 font-[BasisGrotesquePro]">{upcomingEvents.period || 'Next 7 Days'}</p>
                            {loading ? (
                                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] text-center">Loading...</p>
                            ) : upcomingEvents.count === 0 ? (
                                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] text-center">No upcoming events</p>
                            ) : (
                                <div className="space-y-2">
                                    {upcomingEvents.events.slice(0, 5).map((event, index) => (
                                        <div key={index} className="bg-[#FFF5E0] border border-[#FFE0B2] rounded-lg px-2 py-1.5">
                                            <div className="text-xs font-medium text-gray-900 font-[BasisGrotesquePro] mb-0.5">
                                                {event.subject || 'Event'}
                                            </div>
                                            <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-0.5">
                                                {event.appointment_date || ''}
                                            </div>
                                            <div className="text-xs font-[BasisGrotesquePro]" style={{ color: '#00C0C6' }}>
                                                {formatTime(event.appointment_time)} - {formatTime(event.end_time || (event.appointment_time && (() => {
                                                    const [hours, minutes] = event.appointment_time.split(':');
                                                    const duration = event.appointment_duration || 30;
                                                    const totalMinutes = parseInt(hours) * 60 + parseInt(minutes) + duration;
                                                    const endHours = Math.floor(totalMinutes / 60) % 24;
                                                    const endMins = totalMinutes % 60;
                                                    return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00`;
                                                })()))}
                                            </div>
                                            {getEventParticipants(event) && (
                                                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-0.5">
                                                    {getEventParticipants(event)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Events modal for viewing all meetings on a date */}
            {eventsModal.open && (
                <div
                    className="fixed inset-0 z-[1100] bg-black bg-opacity-50 flex items-center justify-center p-4"
                    onClick={closeEventsModal}
                >
                    <div
                        className="bg-white rounded-lg !border border-[#E8F0FF] w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-[#E8F0FF]">
                            <div>
                                <h5 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro]">Scheduled Meetings</h5>
                                <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">{eventsModal.dateLabel}</p>
                            </div>
                            <button
                                onClick={closeEventsModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Close"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                                    <path
                                        d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z"
                                        fill="#3B4A66"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 space-y-3 overflow-y-auto">
                            {eventsModal.events.length === 0 ? (
                                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] text-center py-4">No meetings scheduled.</p>
                            ) : (
                                eventsModal.events.map((event, idx) => (
                                    <div key={`${event.id || idx}-${event.appointment_time || idx}`} className="border border-[#E8F0FF] rounded-lg p-3">
                                        <div className="flex items-start justify-between mb-1">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">
                                                    {event.subject || 'Meeting'}
                                                </p>
                                                {renderParticipantButtons(event)}
                                            </div>
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full font-[BasisGrotesquePro] ${event.appointment_status === 'cancelled'
                                                    ? 'bg-red-100 text-red-700'
                                                    : event.appointment_status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-green-100 text-green-700'
                                                    }`}
                                            >
                                                {event.status_display || event.appointment_status || 'Scheduled'}
                                            </span>
                                        </div>
                                        <div className="text-xs font-[BasisGrotesquePro]" style={{ color: '#00C0C6' }}>
                                            {formatTime(event.appointment_time)}{' '}
                                            {event.end_time ? `- ${formatTime(event.end_time)}` : event.appointment_duration ? `(${event.appointment_duration}m)` : ''}
                                        </div>
                                        {event.description && (
                                            <p className="text-xs text-gray-600 font-[BasisGrotesquePro] mt-2 line-clamp-3">{event.description}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="flex items-center justify-end gap-2 p-4 border-t border-[#E8F0FF]">
                            <button
                                onClick={closeEventsModal}
                                className="px-4 py-2 text-sm bg-white !border border-[#E8F0FF] rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Overlap Warning Modal */}
            {showOverlapModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ml-10 mt-6">
                    <div className="bg-white rounded-lg !border border-[#E8F0FF] w-full max-w-2xl max-h-[80vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between p-4 border-b border-[#E8F0FF] flex-shrink-0">
                            <div>
                                <h5 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro] mb-0.5">Time Slot Conflict</h5>
                                <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                                    This time slot conflicts with {overlappingAppointments.length} existing {overlappingAppointments.length === 1 ? 'meeting' : 'meetings'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowOverlapModal(false);
                                    setOverlappingAppointments([]);
                                    setNewAppointmentDetails(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                                    <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="p-4 space-y-4 overflow-y-auto flex-1">
                            {/* New Appointment Details */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <h6 className="text-sm font-semibold text-gray-900 mb-2 font-[BasisGrotesquePro]">New Appointment</h6>
                                <div className="space-y-1 text-sm text-gray-700 font-[BasisGrotesquePro]">
                                    <p><span className="font-medium">Title:</span> {newAppointmentDetails?.event_title || eventTitle}</p>
                                    <p><span className="font-medium">Date:</span> {newAppointmentDetails?.date || appointmentDate}</p>
                                    <p><span className="font-medium">Time:</span> {newAppointmentDetails?.time || (slots.length > 0 ? slots[0].time : '')}</p>
                                    <p><span className="font-medium">Duration:</span> {newAppointmentDetails?.duration || appointmentDuration} minutes</p>
                                    {slots.length > 0 && slots[0].client_id && (
                                        <p><span className="font-medium">Client:</span> {
                                            clients.find(c => c.id === slots[0].client_id)
                                                ? `${clients.find(c => c.id === slots[0].client_id).first_name || ''} ${clients.find(c => c.id === slots[0].client_id).last_name || ''}`.trim()
                                                : `Client #${slots[0].client_id}`
                                        }</p>
                                    )}
                                </div>
                            </div>

                            {/* Overlapping Appointments */}
                            <div>
                                <h6 className="text-sm font-semibold text-gray-900 mb-2 font-[BasisGrotesquePro]">
                                    Overlapping Appointments ({overlappingAppointments.length})
                                </h6>
                                <div className="space-y-2">
                                    {overlappingAppointments.map((appointment, index) => (
                                        <div key={appointment.id || index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">
                                                        {appointment.subject || 'Untitled Meeting'}
                                                    </p>
                                                    {appointment.client && (
                                                        <p className="text-xs text-gray-600 font-[BasisGrotesquePro] mt-0.5">
                                                            Client: {appointment.client.name || appointment.client.email || 'N/A'}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full font-[BasisGrotesquePro] ${appointment.appointment_status === 'confirmed'
                                                    ? 'bg-green-100 text-green-800'
                                                    : appointment.appointment_status === 'scheduled'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {appointment.appointment_status || 'scheduled'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 font-[BasisGrotesquePro]">
                                                <p><span className="font-medium">Date:</span> {appointment.appointment_date}</p>
                                                <p><span className="font-medium">Time:</span> {formatTime(appointment.appointment_time)} ({appointment.appointment_duration || 30}m)</p>
                                                {appointment.meeting_location && (
                                                    <p><span className="font-medium">Location:</span> {appointment.meeting_location}</p>
                                                )}
                                                {appointment.appointment_type && (
                                                    <p><span className="font-medium">Type:</span> {appointment.appointment_type}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Warning Message */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-sm text-amber-800 font-[BasisGrotesquePro]">
                                    <strong>Warning:</strong> Creating this meeting will cancel the overlapping appointment{overlappingAppointments.length > 1 ? 's' : ''} listed above.
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-2 p-4 border-t border-[#E8F0FF] flex-shrink-0">
                            <button
                                onClick={() => {
                                    setShowOverlapModal(false);
                                    setOverlappingAppointments([]);
                                    setNewAppointmentDetails(null);
                                }}
                                disabled={confirmingOverwrite}
                                className="px-4 py-1.5 text-sm bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-gray-700 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmOverwrite}
                                disabled={confirmingOverwrite}
                                className="px-4 py-1.5 text-sm bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {confirmingOverwrite ? 'Creating...' : `Create Meeting & Cancel ${overlappingAppointments.length} Conflicting ${overlappingAppointments.length === 1 ? 'Meeting' : 'Meetings'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Calendar Event Modal */}
            {isAddEventModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-lg !border border-[#E8F0FF] w-full max-w-xl max-h-[75vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between p-3 border-b border-[#E8F0FF] flex-shrink-0">
                            <div>
                                <h5 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro] mb-0.5">Add Calendar Event</h5>
                                <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Schedule a new meeting, appointment, or deadline</p>
                            </div>
                            <button
                                onClick={() => setIsAddEventModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                                    <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
                                </svg>

                            </button>
                        </div>

                        {/* Modal Body - Scrollable - Matching Tax Preparer Modal Structure */}
                        <div className="px-6 py-4 space-y-5 overflow-y-auto flex-1">
                            {/* Event Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                                    Event Title <span style={{ color: "#EF4444" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={eventTitle}
                                    onChange={(e) => setEventTitle(e.target.value)}
                                    placeholder="Enter event title"
                                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-[BasisGrotesquePro]"
                                    style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
                                    required
                                />
                            </div>

                            {/* Appointment Duration & Timezone */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                                        Appointment Duration (minutes) <span style={{ color: "#EF4444" }}>*</span>
                                    </label>
                                    <select
                                        value={appointmentDuration}
                                        onChange={(e) => setAppointmentDuration(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white font-[BasisGrotesquePro]"
                                        style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
                                        required
                                    >
                                        <option value={30}>30 minutes</option>
                                        <option value={60}>60 minutes</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                                        Timezone <span style={{ color: "#EF4444" }}>*</span>
                                    </label>
                                    <select
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white font-[BasisGrotesquePro]"
                                        style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
                                        required
                                    >
                                        <option value="America/New_York">America/New_York (EST)</option>
                                        <option value="America/Chicago">America/Chicago (CST)</option>
                                        <option value="America/Denver">America/Denver (MST)</option>
                                        <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                                        <option value="America/Phoenix">America/Phoenix (MST - No DST)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                                    Appointment Date <span style={{ color: "#EF4444" }}>*</span>
                                </label>
                                <input
                                    type="date"
                                    value={appointmentDate}
                                    onChange={(e) => setAppointmentDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-[BasisGrotesquePro]"
                                    style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
                                    required
                                />
                            </div>

                            {/* Time Slots */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                                    Time Slots <span style={{ color: "#EF4444" }}>*</span>
                                </label>
                                <div className="space-y-3">
                                    {slots.map((slot) => (
                                        <div key={slot.id} className="flex items-center gap-2 flex-wrap">
                                            <input
                                                type="time"
                                                value={slot.time}
                                                onChange={(e) => handleTimeSlotChange(slot.id, 'time', e.target.value)}
                                                className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-[BasisGrotesquePro]"
                                                style={{ minWidth: '120px', border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
                                                required
                                            />
                                            <select
                                                value={slot.client_id}
                                                onChange={(e) => handleTimeSlotChange(slot.id, 'client_id', e.target.value)}
                                                className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white font-[BasisGrotesquePro]"
                                                style={{ minWidth: '200px', border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
                                                required
                                                disabled={loadingClients}
                                            >
                                                <option value="">Select Client</option>
                                                {clients.map((client) => (
                                                    <option key={client.id} value={client.id}>
                                                        {client.first_name && client.last_name
                                                            ? `${client.first_name} ${client.last_name}`
                                                            : client.email || `Client #${client.id}`}
                                                    </option>
                                                ))}
                                            </select>
                                            {slots.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeTimeSlot(slot.id)}
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addTimeSlot}
                                        className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2 font-[BasisGrotesquePro]"
                                        style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)', borderRadius: '8px' }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Add Time Slot
                                    </button>
                                </div>
                            </div>

                            {/* Meeting Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                                    Meeting Type <span style={{ color: "#EF4444" }}>*</span>
                                </label>
                                <select
                                    value={meetingType}
                                    onChange={(e) => setMeetingType(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white font-[BasisGrotesquePro]"
                                    style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
                                    required
                                >
                                    <option value="zoom">Zoom</option>
                                    <option value="google_meet">Google Meet</option>
                                    <option value="in_person">In Person</option>
                                    <option value="on_call">Phone Call</option>
                                </select>
                            </div>

                            {/* Assign Staff */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                                    Assign Staff <span style={{ color: "#EF4444" }}>*</span>
                                </label>
                                <select
                                    value={assignedStaffId}
                                    onChange={(e) => setAssignedStaffId(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white font-[BasisGrotesquePro]"
                                    style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
                                    required
                                    disabled={loadingStaff}
                                >
                                    <option value="">Select Staff Member</option>
                                    {staffMembers.map((staff) => {
                                        const staffName = staff.staff_member?.name || staff.name || 'Unknown Staff';
                                        const staffEmail = staff.contact?.email || staff.email || '';
                                        const staffRole = staff.role?.primary || staff.role?.display || '';
                                        return (
                                            <option key={staff.id} value={staff.id}>
                                                {staffName}{staffEmail ? ` (${staffEmail})` : ''}{staffRole ? ` - ${staffRole}` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                                {loadingStaff && (
                                    <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">Loading staff members...</p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter description"
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none font-[BasisGrotesquePro]"
                                    style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-2 p-3 border-t border-[#E8F0FF] flex-shrink-0">
                            <button
                                onClick={() => setIsAddEventModalOpen(false)}
                                className="px-4 py-1.5 text-sm bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateMeeting}
                                disabled={creatingMeeting || !eventTitle.trim() || !appointmentDate || slots.every(slot => !slot.time || !slot.client_id) || !assignedStaffId}
                                className="px-4 py-2 bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro]"
                                style={{ borderRadius: '8px' }}
                            >
                                {creatingMeeting ? 'Creating...' : 'Create Meeting'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Set Availability Modal */}
            <SetAvailabilityModal
                isOpen={isSetAvailabilityModalOpen}
                onClose={() => setIsSetAvailabilityModalOpen(false)}
                onSuccess={async () => {
                    await fetchCalendarData();
                }}
                isTaxpayer={false}
            />
        </div>
    );
};

export default SchedulingCalendar;

