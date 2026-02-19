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
    const [activeMetricFilter, setActiveMetricFilter] = useState(null);
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
                        className="text-[#F56D2D] hover:underline"
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
                        className="text-[#F56D2D] hover:underline"
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




    // Handle managing appointment (approve/cancel)
    const handleManageAppointment = async (appointmentId, action, reason = '') => {
        try {
            // Show processing toast if needed, but for now we'll just rely on success/error toasts

            const response = await firmAdminMeetingsAPI.manageAppointment(appointmentId, action, reason);

            if (response.success) {
                toast.success(response.message || `Appointment ${action === 'approve' ? 'approved' : 'rejected'} successfully`, {
                    position: 'top-right',
                    autoClose: 3000
                });

                // Refresh calendar data
                await fetchCalendarData();

                // If the modal is open, update the events list locally to reflect the change immediately
                if (eventsModal.open) {
                    setEventsModal(prev => ({
                        ...prev,
                        events: prev.events.map(evt => {
                            if (evt.id === appointmentId) {
                                const newStatus = action === 'approve' ? 'scheduled' : 'cancelled'; // Note: API might return status, but 'scheduled' is usually what 'approve' does for firm
                                // However, checking the API response would be better if it returned the updated appointment.
                                // For now, let's assume 'scheduled' for approve and 'cancelled' for cancel.
                                // Check what backend does: usually 'confirmed' or 'scheduled' for approve.
                                const statusDisplay = action === 'approve' ? 'Confirmed' : 'Cancelled';
                                return {
                                    ...evt,
                                    appointment_status: newStatus,
                                    status_display: statusDisplay
                                };
                            }
                            return evt;
                        })
                    }));
                }
            } else {
                toast.error(response.message || 'Failed to update appointment', {
                    position: 'top-right',
                    autoClose: 3000
                });
            }
        } catch (error) {
            console.error('Error managing appointment:', error);
            toast.error(handleAPIError(error) || 'Failed to update appointment', {
                position: 'top-right',
                autoClose: 3000
            });
        }
    };

    // Handle update appointment status (complete, reschedule/cancel)
    const handleUpdateStatus = async (appointmentId, status) => {
        try {
            const response = await firmAdminMeetingsAPI.updateAppointmentStatus(appointmentId, status);
            // Check for success in response (some APIs return success: true, others just data)
            if (response.success || response.status === 'success' || response.id) {
                toast.success(`Appointment marked as ${status}`, { position: 'top-right', asutoClose: 3000 });
                await fetchCalendarData();
                // Update local modal state
                if (eventsModal.open) {
                    setEventsModal(prev => ({
                        ...prev,
                        events: prev.events.map(evt => {
                            if (evt.id === appointmentId) {
                                return {
                                    ...evt,
                                    appointment_status: status,
                                    status_display: status.charAt(0).toUpperCase() + status.slice(1)
                                };
                            }
                            return evt;
                        })
                    }));
                }
            } else {
                toast.error(response.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            handleAPIError(error);
        }
    };

    const handleReschedule = (event) => {
        // Pre-fill form
        setEventTitle(event.subject || event.title || `Rescheduled: ${event.client?.name || 'Meeting'}`);

        // Calculate duration if possible, default to 30
        let duration = 30;
        if (event.appointment_duration) {
            duration = event.appointment_duration;
        }
        setAppointmentDuration(duration);

        // Use client info if available
        if (event.client_id) {
            setSlots([{ id: 1, time: '09:00', client_id: event.client_id }]);
        } else if (event.client) {
            setSlots([{ id: 1, time: '09:00', client_id: event.client.id }]);
        }

        // Set staff
        if (event.appointment_with?.id) {
            setAssignedStaffId(event.appointment_with.id);
        } else if (event.staff_id) {
            setAssignedStaffId(event.staff_id);
        }

        setMeetingType(event.meeting_type || 'zoom');
        setDescription(event.description || '');
        setAppointmentDate(''); // Clear date to force selection of new date
        
        // Open modal
        setIsAddEventModalOpen(true);
        setEventsModal(prev => ({ ...prev, open: false }));

        toast.info("Previous appointment info copied. Please select a new date and time.", { autoClose: 5000 });
    };

    // Helper to check if event is past
    const isEventPast = (event) => {
        if (!event.appointment_date || !event.appointment_time) return false;
        // Construct ISO string for comparison
        const eventDateTime = new Date(`${event.appointment_date}T${event.appointment_time}`);
        return eventDateTime < new Date();
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

    // Add ref for calendar section
    const calendarSectionRef = React.useRef(null);

    // Handle metric card click
    const handleMetricCardClick = (metricType) => {
        if (!metricType) return; // Skip if no filter (e.g., no-show rate, avg duration)

        // Update active metric filter
        setActiveMetricFilter(metricType);

        // Scroll to calendar section
        calendarSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Navigation tabs
    const navTabs = ['Calendar', 'Appointments', 'Staff'];

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
        <div className="min-h-screen bg-[#F3F7FF] p-3 sm:p-4 lg:p-6">
            <div className="mx-auto max-w-[1600px]">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
                        <div>
                            <h4 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 lg:mb-2 font-[BasisGrotesquePro]">Firm Calendar</h4>
                            <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">Manage appointments, deadlines, and meetings</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={() => setIsAddEventModalOpen(true)}
                                className="flex-1 sm:flex-none px-4 py-2.5 bg-[#F56D2D] text-white !rounded-xl hover:bg-[#E55A1D] transition-all flex items-center justify-center gap-2 font-[BasisGrotesquePro] text-sm shadow-sm hover:shadow-md"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="whitespace-nowrap">Add Event</span>
                            </button>
                        </div>
                    </div>

                    {/* Metric Cards - Premium responsive grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                        {metricCards.map((card, index) => {
                            const isClickable = index === 0 || index === 1;
                            const metricType = index === 0 ? 'scheduled' : index === 1 ? 'completed' : null;
                            const isActive = activeMetricFilter === metricType;

                            return (
                                <div
                                    key={index}
                                    onClick={() => handleMetricCardClick(metricType)}
                                    className={`bg-white !rounded-xl !border p-3 sm:p-4 transition-all duration-200 ${isClickable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''
                                        } ${isActive
                                            ? 'border-[#3AD6F2] ring-2 ring-[#3AD6F2]/10'
                                            : 'border-[#E8F0FF]'
                                        }`}
                                >
                                    <div className="flex flex-col h-full justify-between gap-3">
                                        <div className="flex items-start justify-between">
                                            <div className="p-2 bg-[#F3F7FF] !rounded-lg text-[#3AD6F2]">
                                                {React.cloneElement(card.icon, { width: 20, height: 20 })}
                                            </div>
                                            <p className="text-lg sm:text-2xl font-black text-gray-900 font-[BasisGrotesquePro] leading-tight-none">{card.value}</p>
                                        </div>
                                        <p className="text-[10px] sm:text-xs font-bold text-gray-400 font-[BasisGrotesquePro] uppercase tracking-widest">{card.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Navigation Tabs and Event Filters */}
                    <div className="flex flex-col lg:flex-row justify-between mb-6 items-start gap-4">
                        {/* Navigation Tabs - Scrollable on mobile */}
                        <div className="w-full lg:w-auto bg-white !rounded-xl !border border-[#E8F0FF] p-1.5 overflow-x-auto no-scrollbar">
                            <div className="flex gap-1.5 whitespace-nowrap min-w-max">
                                {navTabs.map((tab) => {
                                    const tabPath = tab === 'Calendar' ? '/firmadmin/calendar' : `/firmadmin/calendar/${tab.toLowerCase()}`;
                                    return (
                                        <Link
                                            key={tab}
                                            to={tabPath}
                                            className={`px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold font-[BasisGrotesquePro] transition-all !rounded-lg ${activeTab === tab
                                                ? 'bg-[#3AD6F2] !text-white shadow-md shadow-blue-100'
                                                : 'bg-transparent hover:bg-gray-50 !text-gray-500 hover:text-gray-900'
                                                }`}
                                        >
                                            {tab}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div ref={calendarSectionRef} className="flex flex-col lg:flex-row gap-6">
                    {/* Calendar Section */}
                    <div className="w-full lg:flex-1 min-w-0">
                        {/* View Controls - Scrollable on mobile */}
                        <div className="flex gap-1.5 mb-6 overflow-x-auto no-scrollbar p-0.5">
                            {viewTabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setViewMode(tab)}
                                    className={`px-4 sm:px-5 py-2 text-xs font-bold font-[BasisGrotesquePro] transition-all !rounded-lg whitespace-nowrap ${viewMode === tab
                                        ? 'bg-[#F56D2D] text-white shadow-md shadow-orange-100'
                                        : 'bg-white !border border-[#E8F0FF] text-gray-500 hover:text-gray-900 hover:border-gray-300'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Dynamic Navigation */}
                        <div className="bg-white !rounded-xl border border-[#E8F0FF] p-3 sm:p-4 mb-4 shadow-sm">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <h5 className="text-base sm:text-lg font-black text-gray-900 font-[BasisGrotesquePro] text-center sm:text-left">
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
                                        className="w-9 h-9 flex items-center justify-center bg-white !border border-[#E8F0FF] !rounded-xl hover:bg-gray-50 transition-all text-gray-400 hover:text-gray-900 active:scale-95"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={goToToday}
                                        className="h-9 px-4 text-xs font-black bg-white !border border-[#E8F0FF] !rounded-xl hover:bg-gray-50 font-[BasisGrotesquePro] transition-all text-gray-500 hover:text-gray-900 active:scale-95 uppercase tracking-wider"
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
                                        className="w-9 h-9 flex items-center justify-center bg-white !border border-[#E8F0FF] !rounded-xl hover:bg-gray-50 transition-all text-gray-400 hover:text-gray-900 active:scale-95"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Calendar Views */}
                        <div className="bg-white !rounded-xl !border border-[#E8F0FF] p-1.5 sm:p-2 overflow-x-auto no-scrollbar shadow-sm min-h-[500px]">
                            {viewMode === 'Day' && (
                                <div className="p-3 sm:p-5">
                                    <div className="text-center mb-6">
                                        <h5 className="text-3xl font-black text-gray-900 font-[BasisGrotesquePro] leading-none mb-2">{currentDay}</h5>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">{dayNames[currentDate.getDay()]}, {currentMonthName} {currentYear}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        {Array.from({ length: 24 }, (_, i) => {
                                            const hour = i;
                                            const appointments = getAppointmentsForDate(currentDate).filter(apt => {
                                                const aptHour = parseInt(apt.appointment_time?.split(':')[0] || '0');
                                                return aptHour === hour;
                                            });

                                            return (
                                                <div key={i} className="flex gap-4 border-b border-[#F8FAFF] group last:border-0 min-h-[60px] py-1">
                                                    <div className="w-16 flex-shrink-0 text-[10px] font-black text-gray-400 font-[BasisGrotesquePro] uppercase tracking-tighter pt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        {String(hour).padStart(2, '0')}:00
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        {appointments.map((apt, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="bg-[#3AD6F2]/5 border-l-4 border-[#3AD6F2] !rounded-lg p-2 transition-all hover:bg-[#3AD6F2]/10 cursor-pointer shadow-sm group/card"
                                                                onClick={() => openEventsModal(currentDate, [apt])}
                                                            >
                                                                <div className="text-xs font-black text-gray-900 mb-0.5">{apt.subject || 'Meeting'}</div>
                                                                <div className="text-[10px] font-bold text-[#3AD6F2] uppercase tracking-wider">
                                                                    {formatTime(apt.appointment_time)} - {apt.end_time ? formatTime(apt.end_time) : `${apt.appointment_duration}m`}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {viewMode === 'Week' && (
                                <div className="grid grid-cols-7 gap-1 min-w-[700px] sm:min-w-0">
                                    {dayNames.map((day) => (
                                        <div key={day} className="text-center text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest py-3 font-[BasisGrotesquePro] border-b border-[#E8F0FF]">
                                            {day}
                                        </div>
                                    ))}
                                    {weekDays.map((day, index) => {
                                        const dateObj = new Date(day.year, day.month, day.date);
                                        const dayAppointments = getAppointmentsForDate(dateObj);
                                        const isHighlighted = highlightDate ? isSameCalendarDay(dateObj, highlightDate) : day.isToday;

                                        return (
                                            <div key={index} className={`min-h-[250px] p-1.5 sm:p-2 border-r last:border-r-0 border-[#E8F0FF]/50 transition-colors ${isHighlighted ? 'bg-[#F3F7FF]/30' : ''}`}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className={`text-xs font-black w-6 h-6 flex items-center justify-center !rounded-lg ${isHighlighted ? 'bg-[#3AD6F2] text-white shadow-sm' : 'text-gray-400'}`}>
                                                        {day.date}
                                                    </span>
                                                </div>
                                                <div className="space-y-1">
                                                    {dayAppointments.slice(0, 3).map((apt, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="p-1 rounded bg-[#3AD6F2]/5 border-l-2 border-[#3AD6F2] text-[9px] font-bold text-gray-700 truncate cursor-pointer hover:bg-[#3AD6F2]/10 transition-colors"
                                                            onClick={() => openEventsModal(dateObj, [apt])}
                                                        >
                                                            {apt.subject}
                                                        </div>
                                                    ))}
                                                    {dayAppointments.length > 3 && (
                                                        <button
                                                            className="w-full text-[9px] font-black text-[#F56D2D] hover:underline"
                                                            onClick={() => openEventsModal(dateObj, dayAppointments)}
                                                        >
                                                            + {dayAppointments.length - 3} more
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {viewMode === 'Monthly' && (
                                <div className="grid grid-cols-7 min-w-[800px] lg:min-w-0">
                                    {dayNames.map((day) => (
                                        <div key={day} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest py-4 border-b border-[#E8F0FF] border-r border-[#E8F0FF]/50 last:border-r-0">
                                            {day}
                                        </div>
                                    ))}
                                    {calendarDays.map((date, index) => {
                                        const dayAppointments = getAppointmentsForDate(date);
                                        const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                                        const isHighlighted = highlightDate ? isSameCalendarDay(date, highlightDate) : isSameCalendarDay(date, new Date());

                                        return (
                                            <div
                                                key={index}
                                                className={`min-h-[140px] p-1.5 sm:p-2 border-b border-r border-[#E8F0FF]/50 transition-all ${(index + 1) % 7 === 0 ? 'border-r-0' : ''} ${!isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'}`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-[10px] sm:text-xs font-black w-6 h-6 flex items-center justify-center !rounded-lg ${isHighlighted ? 'bg-[#3AD6F2] text-white shadow-md' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                                                        {date.getDate()}
                                                    </span>
                                                    {dayAppointments.length > 0 && (
                                                        <div className="w-1.5 h-1.5 bg-[#F56D2D] !rounded-full shadow-sm"></div>
                                                    )}
                                                </div>
                                                <div className="space-y-1 overflow-y-auto max-h-[100px] no-scrollbar">
                                                    {dayAppointments.slice(0, 3).map((apt, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => openEventsModal(date, dayAppointments)}
                                                            className={`p-1 rounded text-[9px] font-bold truncate transition-all cursor-pointer ${getEventChipClasses(apt.appointment_status)} hover:brightness-95`}
                                                        >
                                                            <span className="opacity-70 mr-1">{formatTime(apt.appointment_time).split(' ')[0]}</span>
                                                            {apt.subject}
                                                        </div>
                                                    ))}
                                                    {dayAppointments.length > 3 && (
                                                        <button
                                                            className="w-full text-center text-[9px] font-black text-[#F56D2D] bg-[#F56D2D]/5 py-0.5 rounded"
                                                            onClick={() => openEventsModal(date, dayAppointments)}
                                                        >
                                                            +{dayAppointments.length - 3} more
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {viewMode === 'Years' && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3 sm:p-5">
                                    {yearMonths.map((month, index) => (
                                        <div
                                            key={index}
                                            onClick={() => {
                                                setCurrentDate(new Date(month.year, month.index, 1));
                                                setViewMode('Monthly');
                                            }}
                                            className="p-4 sm:p-6 bg-white border border-[#E8F0FF] !rounded-2xl hover:border-[#3AD6F2] hover:shadow-xl hover:shadow-blue-50/50 cursor-pointer transition-all group"
                                        >
                                            <h6 className="text-sm font-black text-gray-900 font-[BasisGrotesquePro] mb-1 group-hover:text-[#3AD6F2] transition-colors uppercase tracking-widest">{month.name}</h6>
                                            <div className="text-[10px] font-bold text-gray-400 font-[BasisGrotesquePro] uppercase tracking-tighter">{month.year}</div>
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
                    {/* Right Sidebar - Premium desktop sidebar, stacks on mobile */}
                    <div className="w-full lg:w-80 flex flex-col gap-6">
                        {/* Today's Events Card */}
                        <div className="bg-white !rounded-2xl !border border-[#E8F0FF] shadow-sm overflow-hidden flex flex-col">
                            <div className="px-4 py-3 border-b border-[#F8FAFF] bg-[#F8FAFF]/50 flex items-center gap-2">
                                <h6 className="text-[10px] font-black text-[#3AD6F2] font-[BasisGrotesquePro] uppercase tracking-[0.2em] whitespace-nowrap">Schedule Today</h6>
                                <span className="text-[#3AD6F2] font-black text-[10px] opacity-40">·</span>
                                <h5 className="text-sm font-black text-gray-900 font-[BasisGrotesquePro] leading-none">Today's Events</h5>
                            </div>

                            <div className="p-4 flex flex-col gap-3">
                                <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 font-[BasisGrotesquePro] uppercase tracking-wider mb-1">
                                    <span>Date</span>
                                    <span className="text-gray-900">{todayEvents.date_display || 'N/A'}</span>
                                </div>

                                {loading ? (
                                    <div className="py-8 flex flex-col items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-[#3AD6F2] border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading...</span>
                                    </div>
                                ) : todayEvents.count === 0 ? (
                                    <div className="py-8 bg-gray-50/50 !rounded-xl border border-dashed border-gray-100 flex flex-col items-center justify-center p-4 text-center">
                                        <p className="text-[11px] font-bold text-gray-400 font-[BasisGrotesquePro]">No events scheduled</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {todayEvents.events.map((event, index) => (
                                            <div key={index} className="group p-3 bg-white !rounded-xl !border border-[#E8F0FF] hover:border-[#3AD6F2] hover:shadow-md transition-all cursor-pointer">
                                                <div className="flex flex-col gap-2">
                                                    <div className="text-xs font-black text-gray-900 font-[BasisGrotesquePro] leading-tight group-hover:text-[#3AD6F2] transition-colors">
                                                        {event.subject || 'Event'}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-[#3AD6F2]/10 !rounded-lg">
                                                            <div className="w-1 h-1 bg-[#3AD6F2] !rounded-full"></div>
                                                            <span className="text-[9px] font-black text-[#3AD6F2] uppercase tracking-wider">
                                                                {formatTime(event.appointment_time)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {getEventParticipants(event) && (
                                                        <div className="text-[10px] font-bold text-gray-400 font-[BasisGrotesquePro] pt-1 border-t border-[#F8FAFF]">
                                                            {getEventParticipants(event)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Upcoming Events Card */}
                        <div className="bg-white !rounded-2xl !border border-[#E8F0FF] shadow-sm overflow-hidden flex flex-col">
                            <div className="px-4 py-3 border-b border-[#F8FAFF] bg-[#F8FAFF]/50 flex items-center gap-2">
                                <h6 className="text-[10px] font-black text-[#F56D2D] font-[BasisGrotesquePro] uppercase tracking-[0.2em] whitespace-nowrap">Coming Up</h6>
                                <span className="text-[#F56D2D] font-black text-[10px] opacity-40">·</span>
                                <h5 className="text-sm font-black text-gray-900 font-[BasisGrotesquePro] leading-none">Upcoming {upcomingEvents.period || 'Events'}</h5>
                            </div>

                            <div className="p-4 flex flex-col gap-3">
                                {loading ? (
                                    <div className="py-8 flex flex-col items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-[#F56D2D] border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading...</span>
                                    </div>
                                ) : upcomingEvents.count === 0 ? (
                                    <div className="py-8 bg-gray-50/50 !rounded-xl border border-dashed border-gray-100 flex flex-col items-center justify-center p-4 text-center">
                                        <p className="text-[11px] font-bold text-gray-400 font-[BasisGrotesquePro]">No upcoming events</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {upcomingEvents.events.slice(0, 5).map((event, index) => (
                                            <div key={index} className="group p-3 bg-white !rounded-xl !border border-[#E8F0FF] hover:border-[#F56D2D] hover:shadow-md transition-all cursor-pointer">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{event.appointment_date}</span>
                                                        <div className="px-2 py-0.5 bg-[#F56D2D]/10 !rounded-lg">
                                                            <span className="text-[9px] font-black text-[#F56D2D] uppercase tracking-wider">{formatTime(event.appointment_time)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs font-black text-gray-900 font-[BasisGrotesquePro] leading-tight group-hover:text-[#F56D2D] transition-colors">
                                                        {event.subject || 'Event'}
                                                    </div>
                                                    {getEventParticipants(event) && (
                                                        <div className="text-[10px] font-bold text-gray-400 font-[BasisGrotesquePro] pt-1 border-t border-[#F8FAFF]">
                                                            {getEventParticipants(event)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={() => setViewMode('Agenda')}
                                    className="w-full mt-2 py-2 text-[10px] font-black text-gray-400 hover:text-gray-900 uppercase tracking-[0.2em] transition-colors"
                                >
                                    View Full Agenda
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Events modal for viewing all meetings on a date - Premium Responsive */}
            {eventsModal.open && (
                <div
                    className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={closeEventsModal}
                >
                    <div
                        className="bg-white !rounded-2xl !border border-[#E8F0FF] w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-[#F8FAFF]">
                            <div>
                                <h6 className="text-[10px] font-black text-[#3AD6F2] font-[BasisGrotesquePro] uppercase tracking-[0.2em] mb-1">Daily Schedule</h6>
                                <h5 className="text-xl font-black text-gray-900 font-[BasisGrotesquePro] leading-none">{eventsModal.dateLabel}</h5>
                            </div>
                            <button
                                onClick={closeEventsModal}
                                className="w-10 h-10 flex items-center justify-center !rounded-xl bg-[#F3F7FF] text-gray-400 hover:text-gray-900 hover:bg-[#E8F0FF] transition-all"
                                aria-label="Close"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
                            {eventsModal.events.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-[#F3F7FF] !rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-[#3AD6F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-bold text-gray-400 font-[BasisGrotesquePro] uppercase tracking-widest">No meetings scheduled</p>
                                </div>
                            ) : (
                                eventsModal.events.map((event, idx) => (
                                    <div key={`${event.id || idx}-${event.appointment_time || idx}`} className="group relative bg-white !rounded-2xl !border border-[#E8F0FF] p-4 hover:border-[#3AD6F2] hover:shadow-lg transition-all">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`w-2 h-2 !rounded-full ${event.appointment_status === 'cancelled' ? 'bg-red-500' : event.appointment_status === 'pending' ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                                                    <p className="text-sm font-black text-gray-900 font-[BasisGrotesquePro]">
                                                        {event.subject || 'Untitled Meeting'}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <div className="px-2 py-0.5 bg-[#3AD6F2]/10 !rounded-lg text-[10px] font-black text-[#3AD6F2] uppercase tracking-wider">
                                                        {formatTime(event.appointment_time)}
                                                        {event.end_time ? ` - ${formatTime(event.end_time)}` : event.appointment_duration ? ` (${event.appointment_duration}m)` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                            <span
                                                className={`text-[9px] font-black px-2.5 py-1 !rounded-lg uppercase tracking-widest ${event.appointment_status === 'cancelled'
                                                    ? 'bg-red-50 text-red-600'
                                                    : event.appointment_status === 'pending'
                                                        ? 'bg-yellow-50 text-yellow-600'
                                                        : 'bg-green-50 text-green-600'
                                                    }`}
                                            >
                                                {event.status_display || event.appointment_status || 'Scheduled'}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            {renderParticipantButtons(event)}
                                            {event.description && (
                                                <p className="text-xs text-gray-500 font-[BasisGrotesquePro] leading-relaxed line-clamp-2 italic">
                                                    "{event.description}"
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#F8FAFF]">
                                            {event.appointment_status === 'pending' ? (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleManageAppointment(event.id, 'approve');
                                                        }}
                                                        className="flex-1 px-4 py-2.5 text-[10px] font-black text-white bg-green-500 hover:bg-green-600 !rounded-xl transition-all shadow-md shadow-green-100 uppercase tracking-[0.2em]"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleManageAppointment(event.id, 'cancel');
                                                        }}
                                                        className="flex-1 px-4 py-2.5 text-[10px] font-black text-white bg-red-500 hover:bg-red-600 !rounded-xl transition-all shadow-md shadow-red-100 uppercase tracking-[0.2em]"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    {(event.google_meet_link || event.zoom_meeting_link) && event.appointment_status !== 'cancelled' && event.appointment_status !== 'completed' && (
                                                        <a
                                                            href={event.google_meet_link || event.zoom_meeting_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-black text-white bg-[#3AD6F2] hover:bg-[#34c2db] !rounded-xl transition-all shadow-md shadow-blue-100 uppercase tracking-[0.1em]"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                            Join
                                                        </a>
                                                    )}

                                                    {isEventPast(event) && event.appointment_status !== 'cancelled' && event.appointment_status !== 'completed' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleUpdateStatus(event.id, 'completed');
                                                            }}
                                                            className="flex-1 min-w-[100px] px-4 py-2.5 text-[10px] font-black text-white bg-green-500 hover:bg-green-600 !rounded-xl transition-all shadow-md shadow-green-100 uppercase tracking-[0.1em]"
                                                        >
                                                            Complete
                                                        </button>
                                                    )}

                                                    {(isEventPast(event) || event.appointment_status === 'cancelled') && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleReschedule(event);
                                                            }}
                                                            className="flex-1 min-w-[100px] px-4 py-2.5 text-[10px] font-black text-white bg-orange-500 hover:bg-orange-600 !rounded-xl transition-all shadow-md shadow-orange-100 uppercase tracking-[0.1em]"
                                                        >
                                                            Reschedule
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-5 border-t border-[#F8FAFF] flex justify-end">
                            <button
                                onClick={closeEventsModal}
                                className="px-8 py-3 text-[10px] font-black bg-white !border border-[#E8F0FF] !rounded-xl hover:bg-gray-50 text-gray-900 transition-all uppercase tracking-[0.2em]"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Overlap Warning Modal - Premium Responsive */}
            {showOverlapModal && (
                <div className="fixed inset-0 z-[1110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white !rounded-2xl !border border-[#E8F0FF] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-[#F8FAFF]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-50 !rounded-xl flex items-center justify-center text-red-500">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h6 className="text-[10px] font-black text-red-500 font-[BasisGrotesquePro] uppercase tracking-[0.2em] mb-1">Scheduling Conflict</h6>
                                    <h5 className="text-xl font-black text-gray-900 font-[BasisGrotesquePro] leading-none">Time Slot Conflict</h5>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowOverlapModal(false);
                                    setOverlappingAppointments([]);
                                    setNewAppointmentDetails(null);
                                }}
                                className="w-10 h-10 flex items-center justify-center !rounded-xl bg-[#F3F7FF] text-gray-400 hover:text-gray-900 hover:bg-[#E8F0FF] transition-all"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                            <div className="bg-[#F3F7FF]/50 !rounded-2xl border border-[#E8F0FF] p-5">
                                <h6 className="text-[10px] font-black text-gray-400 font-[BasisGrotesquePro] uppercase tracking-widest mb-3">Proposed Appointment</h6>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Title</span>
                                        <span className="text-sm font-black text-gray-900">{newAppointmentDetails?.event_title || eventTitle}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Date & Time</span>
                                        <span className="text-sm font-black text-gray-900">
                                            {newAppointmentDetails?.date || appointmentDate} @ {newAppointmentDetails?.time || (slots.length > 0 ? slots[0].time : '')} ({newAppointmentDetails?.duration || appointmentDuration}m)
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h6 className="text-[10px] font-black text-red-500 font-[BasisGrotesquePro] uppercase tracking-widest">Conflicting Appointments ({overlappingAppointments.length})</h6>
                                </div>
                                <div className="grid gap-3">
                                    {overlappingAppointments.map((appointment, index) => (
                                        <div key={appointment.id || index} className="p-4 bg-white !rounded-2xl !border border-red-100 hover:border-red-200 transition-all flex flex-col gap-3 relative overflow-hidden group">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400"></div>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="text-sm font-black text-gray-900 font-[BasisGrotesquePro] group-hover:text-red-600 transition-colors">
                                                        {appointment.subject || 'Untitled Meeting'}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{appointment.appointment_date}</span>
                                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">{formatTime(appointment.appointment_time)}</span>
                                                    </div>
                                                </div>
                                                <span className={`text-[9px] font-black px-2 py-1 !rounded-lg uppercase tracking-widest ${appointment.appointment_status === 'confirmed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                    {appointment.appointment_status || 'scheduled'}
                                                </span>
                                            </div>
                                            {appointment.client && (
                                                <div className="flex items-center gap-2 pt-2 border-t border-red-50">
                                                    <div className="w-5 h-5 !rounded-full bg-red-50 flex items-center justify-center text-[10px] font-bold text-red-500">
                                                        {appointment.client.name?.charAt(0) || 'C'}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-gray-600">
                                                        Client: {appointment.client.name || appointment.client.email || 'N/A'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-red-50 border border-red-100 !rounded-xl flex gap-3">
                                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs font-bold text-red-700 font-[BasisGrotesquePro] leading-relaxed">
                                    Warning: Confirming this meeting will automatically <span className="underline decoration-2">cancel</span> all conflicting appointments listed above.
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t border-[#F8FAFF] flex items-center justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowOverlapModal(false);
                                    setOverlappingAppointments([]);
                                    setNewAppointmentDetails(null);
                                }}
                                disabled={confirmingOverwrite}
                                className="px-6 py-3 text-[10px] font-black bg-white !border border-[#E8F0FF] !rounded-xl hover:bg-gray-50 text-gray-900 transition-all uppercase tracking-[0.2em] disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmOverwrite}
                                disabled={confirmingOverwrite}
                                className="flex-1 max-w-sm px-6 py-3 text-[10px] font-black text-white bg-red-500 hover:bg-red-600 !rounded-xl transition-all shadow-lg shadow-red-100 uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {confirmingOverwrite ? 'Processing...' : `Overwrite & Cancel (${overlappingAppointments.length}) Conflicts`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Add Calendar Event Modal - Premium Responsive */}
            {isAddEventModalOpen && (
                <div className="fixed inset-0 z-[1120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white !rounded-3xl !border border-[#E8F0FF] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-[#F8FAFF] bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-[#F56D2D]/10 !rounded-2xl flex items-center justify-center text-[#F56D2D]">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div>
                                    <h6 className="text-[10px] font-black text-[#F56D2D] font-[BasisGrotesquePro] uppercase tracking-[0.2em] mb-1">Event Creator</h6>
                                    <h5 className="text-2xl font-black text-gray-900 font-[BasisGrotesquePro] leading-none">Add Calendar Event</h5>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAddEventModalOpen(false)}
                                className="w-12 h-12 flex items-center justify-center !rounded-2xl bg-[#F3F7FF] text-gray-400 hover:text-gray-900 hover:bg-[#E8F0FF] transition-all"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar bg-white">
                            {/* Section: Basic Details */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-4 w-1 bg-[#F56D2D] rounded-full"></div>
                                    <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Event Information</h6>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2 font-[BasisGrotesquePro]">
                                        Event Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={eventTitle}
                                        onChange={(e) => setEventTitle(e.target.value)}
                                        placeholder="e.g., Quarterly Tax Review"
                                        className="w-full px-5 py-4 bg-white !border-2 !border-[#E8F0FF] !rounded-2xl focus:!border-[#F56D2D] focus:ring-0 transition-all font-[BasisGrotesquePro] text-sm font-bold text-gray-900 placeholder:text-gray-300"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2 font-[BasisGrotesquePro]">
                                            Duration <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={appointmentDuration}
                                                onChange={(e) => setAppointmentDuration(parseInt(e.target.value))}
                                                className="w-full px-5 py-4 bg-white !border-2 !border-[#E8F0FF] !rounded-2xl focus:!border-[#F56D2D] focus:ring-0 appearance-none transition-all font-[BasisGrotesquePro] text-sm font-bold text-gray-900"
                                                required
                                            >
                                                <option value={15}>15 minutes</option>
                                                <option value={30}>30 minutes</option>
                                                <option value={45}>45 minutes</option>
                                                <option value={60}>1 hour</option>
                                                <option value={90}>1.5 hours</option>
                                                <option value={120}>2 hours</option>
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2 font-[BasisGrotesquePro]">
                                            Timezone <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={timezone}
                                                onChange={(e) => setTimezone(e.target.value)}
                                                className="w-full px-5 py-4 bg-white !border-2 !border-[#E8F0FF] !rounded-2xl focus:!border-[#F56D2D] focus:ring-0 appearance-none transition-all font-[BasisGrotesquePro] text-sm font-bold text-gray-900"
                                                required
                                            >
                                                <option value="America/New_York">America/New_York (EST)</option>
                                                <option value="America/Chicago">America/Chicago (CST)</option>
                                                <option value="America/Denver">America/Denver (MST)</option>
                                                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                                                <option value="America/Phoenix">America/Phoenix (MST)</option>
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Logistics */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-4 w-1 bg-[#3AD6F2] rounded-full"></div>
                                    <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logistics & Timing</h6>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2 font-[BasisGrotesquePro]">
                                        Appointment Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={appointmentDate}
                                        onChange={(e) => setAppointmentDate(e.target.value)}
                                        className="w-full px-5 py-4 bg-white !border-2 !border-[#E8F0FF] !rounded-2xl focus:!border-[#F56D2D] focus:ring-0 transition-all font-[BasisGrotesquePro] text-sm font-bold text-gray-900"
                                        required
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2 font-[BasisGrotesquePro]">
                                        Time Slots & Clients <span className="text-red-500">*</span>
                                    </label>
                                    <div className="space-y-3">
                                        {slots.map((slot, index) => (
                                            <div key={slot.id} className="flex gap-3 group/slot items-start animate-in slide-in-from-left duration-200" style={{ animationDelay: `${index * 50}ms` }}>
                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <input
                                                        type="time"
                                                        value={slot.time}
                                                        onChange={(e) => handleTimeSlotChange(slot.id, 'time', e.target.value)}
                                                        className="px-5 py-3 bg-gray-50/50 !border-2 !border-[#E8F0FF] !rounded-xl focus:!border-[#3AD6F2] focus:ring-0 transition-all font-[BasisGrotesquePro] text-sm font-bold text-gray-900"
                                                        required
                                                    />
                                                    <div className="relative">
                                                        <select
                                                            value={slot.client_id}
                                                            onChange={(e) => handleTimeSlotChange(slot.id, 'client_id', e.target.value)}
                                                            className="w-full px-5 py-3 bg-gray-50/50 !border-2 !border-[#E8F0FF] !rounded-xl focus:!border-[#3AD6F2] focus:ring-0 appearance-none transition-all font-[BasisGrotesquePro] text-sm font-bold text-gray-900"
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
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                                {slots.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTimeSlot(slot.id)}
                                                        className="mt-3 w-10 h-10 flex items-center justify-center !rounded-xl text-red-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover/slot:opacity-100"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addTimeSlot}
                                        className="flex items-center gap-2 px-5 py-3 text-[10px] font-black text-[#F56D2D] bg-[#F56D2D]/5 hover:bg-[#F56D2D]/10 !rounded-xl transition-all uppercase tracking-[0.2em] border-2 border-dashed border-[#F56D2D]/20 hover:border-[#F56D2D]/40"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Multi-Slot
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2 font-[BasisGrotesquePro]">
                                            Meeting Type <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={meetingType}
                                                onChange={(e) => setMeetingType(e.target.value)}
                                                className="w-full px-5 py-4 bg-white !border-2 !border-[#E8F0FF] !rounded-2xl focus:!border-[#3AD6F2] focus:ring-0 appearance-none transition-all font-[BasisGrotesquePro] text-sm font-bold text-gray-900"
                                                required
                                            >
                                                <option value="zoom">Zoom Video</option>
                                                <option value="google_meet">Google Meet</option>
                                                <option value="in_person">In-Person Meeting</option>
                                                <option value="on_call">Phone Consultation</option>
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2 font-[BasisGrotesquePro]">
                                            Assign Staff <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={assignedStaffId}
                                                onChange={(e) => setAssignedStaffId(e.target.value)}
                                                className="w-full px-5 py-4 bg-white !border-2 !border-[#E8F0FF] !rounded-2xl focus:!border-[#3AD6F2] focus:ring-0 appearance-none transition-all font-[BasisGrotesquePro] text-sm font-bold text-gray-900"
                                                required
                                                disabled={loadingStaff}
                                            >
                                                <option value="">Select Staff Member</option>
                                                {staffMembers.map((staff) => {
                                                    const staffName = staff.staff_member?.name || staff.name || 'Unknown Staff';
                                                    return <option key={staff.id} value={staff.id}>{staffName}</option>;
                                                })}
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                        {loadingStaff && <p className="text-[9px] font-bold text-[#3AD6F2] mt-2 uppercase tracking-widest">Loading staff roster...</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Section: Additional Information */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-4 w-1 bg-gray-300 rounded-full"></div>
                                    <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Additional Information</h6>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2 font-[BasisGrotesquePro]">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Add notes, agenda items, or specific instructions..."
                                        rows={4}
                                        className="w-full px-5 py-4 bg-white !border-2 !border-[#E8F0FF] !rounded-2xl focus:!border-[#3AD6F2] focus:ring-0 transition-all font-[BasisGrotesquePro] text-sm font-bold text-gray-900 placeholder:text-gray-300 resize-none shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-[#F8FAFF] bg-white flex items-center justify-end gap-4 shadow-[0_-4px_20px_0_rgba(0,0,0,0.02)]">
                            <button
                                onClick={() => setIsAddEventModalOpen(false)}
                                className="px-8 py-4 text-[10px] font-black bg-white !border !border-[#E8F0FF] !rounded-2xl hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-all uppercase tracking-[0.2em]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateMeeting}
                                disabled={creatingMeeting || !eventTitle.trim() || !appointmentDate || slots.every(slot => !slot.time || !slot.client_id) || !assignedStaffId}
                                className="flex-1 max-w-[240px] px-8 py-4 text-[10px] font-black text-white bg-[#F56D2D] hover:bg-[#E55A1D] !rounded-2xl transition-all shadow-xl shadow-orange-100 hover:shadow-orange-200 uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                            >
                                {creatingMeeting ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Saving...</span>
                                    </div>
                                ) : 'Create Meeting'}
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

