import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../../ClientOnboarding/utils/userUtils';
import { handleAPIError, firmAdminMeetingsAPI } from '../../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

const API_BASE_URL = getApiBaseUrl();

export default function AppointmentsTab({ client }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Schedule appointment form state
  const [scheduleForm, setScheduleForm] = useState({
    event_title: '',
    appointment_date: '',
    appointment_time: '',
    duration: 30,
    description: '',
    meeting_type: 'zoom'
  });
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    date_from: '',
    date_to: '',
    sort_by: '-appointment_date'
  });
  const [summary, setSummary] = useState({
    total_appointments: 0,
    appointments_by_status: {}
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Fetch appointments from API
  const fetchAppointments = useCallback(async () => {
    if (!client?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = getAccessToken();
      const queryParams = new URLSearchParams();

      if (filters.status && filters.status !== 'all') {
        queryParams.append('status', filters.status);
      } else {
        queryParams.append('status', 'all');
      }

      if (filters.type && filters.type !== 'all') {
        queryParams.append('type', filters.type);
      } else {
        queryParams.append('type', 'all');
      }

      if (filters.date_from) {
        queryParams.append('date_from', filters.date_from);
      }

      if (filters.date_to) {
        queryParams.append('date_to', filters.date_to);
      }

      if (filters.sort_by) {
        queryParams.append('sort_by', filters.sort_by);
      }

      const url = `${API_BASE_URL}/user/firm-admin/clients/${client.id}/appointments/?${queryParams.toString()}`;

      const response = await fetchWithCors(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setAppointments(result.data.appointments || []);
        setSummary(result.data.summary || {
          total_appointments: 0,
          appointments_by_status: {}
        });
      } else {
        setAppointments([]);
        setSummary({
          total_appointments: 0,
          appointments_by_status: {}
        });
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to load appointments. Please try again.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [client?.id, filters]);

  // Fetch appointments on mount and when filters change
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = (dateString) => {
    if (!dateString) return '';
    // If already in YYYY-MM-DD format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    // Try to parse and format
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toISOString().split('T')[0];
  };

  // Format time for API (HH:MM:SS)
  const formatTimeForAPI = (timeString) => {
    if (!timeString) return '';
    // Remove AM/PM if present
    const isPM = timeString.toUpperCase().includes('PM');
    const isAM = timeString.toUpperCase().includes('AM');
    let time = timeString.replace(/\s*(AM|PM)\s*/i, '').trim();
    const parts = time.split(':');

    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1] || '00';

      if (isPM && hours !== 12) hours += 12;
      if (isAM && hours === 12) hours = 0;

      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    }

    // If already in HH:MM format, add :00 seconds
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return `${timeString}:00`;
    }

    return timeString;
  };

  // Handle schedule appointment
  const handleScheduleAppointment = async () => {
    if (!scheduleForm.event_title.trim()) {
      toast.error('Please enter an event title');
      return;
    }
    if (!scheduleForm.appointment_date) {
      toast.error('Please select a date');
      return;
    }
    if (!scheduleForm.appointment_time) {
      toast.error('Please select a time');
      return;
    }

    try {
      setSubmitting(true);

      const meetingData = {
        event_title: scheduleForm.event_title,
        event_type: 'consultation',
        date: formatDateForAPI(scheduleForm.appointment_date),
        time: formatTimeForAPI(scheduleForm.appointment_time),
        duration: scheduleForm.duration || 30,
        location: '',
        description: scheduleForm.description || '',
        meeting_type: scheduleForm.meeting_type || 'zoom',
        client_id: client.id,
        appointment_with_id: client.id,
        timezone: 'America/New_York'
      };

      const response = await firmAdminMeetingsAPI.createMeeting(meetingData);

      if (response.status === 201 && response.success) {
        toast.success('Appointment scheduled successfully!', {
          position: 'top-right',
          autoClose: 3000
        });

        // Reset form and close modal
        setScheduleForm({
          event_title: '',
          appointment_date: '',
          appointment_time: '',
          duration: 30,
          description: '',
          meeting_type: 'zoom'
        });
        setShowScheduleModal(false);

        // Refresh appointments list
        fetchAppointments();
      } else if (response.status === 409 && response.has_overlap) {
        toast.warning('There is a scheduling conflict. Please choose a different time.', {
          position: 'top-right',
          autoClose: 5000
        });
      } else {
        throw new Error(response.message || 'Failed to schedule appointment');
      }
    } catch (err) {
      console.error('Error scheduling appointment:', err);
      toast.error(handleAPIError(err), {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, filters.type]);

  // Get status color based on API status
  const getStatusColor = (status) => {
    const statusLower = (status?.value || status || '').toLowerCase();
    switch (statusLower) {
      case 'scheduled':
      case 'confirmed':
        return 'bg-[#DBEAFE] text-[#1E40AF]';
      case 'completed':
        return 'bg-[#DCFCE7] text-[#166534]';
      case 'pending':
        return 'bg-[#FFEDD5] text-[#9A3412]';
      case 'in_progress':
        return 'bg-[#E0E7FF] text-[#3730A3]';
      case 'cancelled':
        return 'bg-gray-200 text-gray-700';
      case 'no_show':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get icon based on appointment icon or status
  const getIcon = (appointment) => {
    const iconType = appointment.icon || 'calendar';
    const statusValue = appointment.status?.value || '';

    // Use icon from API if available, otherwise use status-based icon
    if (iconType === 'check-circle' || statusValue === 'completed') {
      return (
        <svg width="40" height="40" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="27" height="27" rx="8" fill="#E8F0FF" />
          <g clipPath="url(#clip0_2277_7952)">
            <path d="M19.75 12.9247V13.4997C19.7492 14.8474 19.3128 16.1588 18.5058 17.2383C17.6989 18.3178 16.5646 19.1075 15.2721 19.4896C13.9796 19.8717 12.5983 19.8259 11.334 19.3588C10.0698 18.8917 8.99041 18.0285 8.25685 16.8978C7.52329 15.7672 7.17487 14.4297 7.26355 13.0849C7.35223 11.74 7.87325 10.4599 8.74892 9.43534C9.6246 8.41081 10.808 7.69679 12.1226 7.39976C13.4372 7.10274 14.8127 7.23863 16.0438 7.78717M11.625 12.8747L13.5 14.7497L19.75 8.49967" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <defs>
            <clipPath id="clip0_2277_7952">
              <rect width="15" height="15" fill="white" transform="translate(6 6)" />
            </clipPath>
          </defs>
        </svg>
      );
    }

    if (statusValue === 'pending' || iconType === 'info') {
      return (
        <svg width="40" height="40" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="27" height="27" rx="8" fill="#E8F0FF" />
          <g clipPath="url(#clip0_2277_7959)">
            <path d="M13.5 11V13.5M13.5 16H13.5063M19.75 13.5C19.75 16.9518 16.9518 19.75 13.5 19.75C10.0482 19.75 7.25 16.9518 7.25 13.5C7.25 10.0482 10.0482 7.25 13.5 7.25C16.9518 7.25 19.75 10.0482 19.75 13.5Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <defs>
            <clipPath id="clip0_2277_7959">
              <rect width="15" height="15" fill="white" transform="translate(6 6)" />
            </clipPath>
          </defs>
        </svg>
      );
    }

    // Default calendar icon
    return (
      <svg width="40" height="40" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="27" height="27" rx="8" fill="#E8F0FF" />
        <path d="M11 7.25V9.75M16 7.25V9.75M7.875 12.25H19.125M9.125 8.5H17.875C18.5654 8.5 19.125 9.05964 19.125 9.75V18.5C19.125 19.1904 18.5654 19.75 17.875 19.75H9.125C8.43464 19.75 7.875 19.1904 7.875 18.5V9.75C7.875 9.05964 8.43464 8.5 9.125 8.5Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'No Show', value: 'no_show' }
  ];

  const typeOptions = [
    { label: 'All Types', value: 'all' },
    { label: 'Consultation', value: 'consultation' },
    { label: 'Tax Preparation', value: 'tax_preparation' },
    { label: 'Review', value: 'review' },
    { label: 'Follow Up', value: 'follow_up' },
    { label: 'Other', value: 'other' }
  ];

  return (
    <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF]">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h5 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-2">Appointments</h5>
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Scheduled meetings and consultations</p>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="px-4 py-2 text-sm font-medium text-white !rounded-lg hover:opacity-90 transition font-[BasisGrotesquePro] flex items-center gap-2"
          style={{ backgroundColor: '#178109' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 1V7M7 7V13M7 7H13M7 7H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Create Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-[BasisGrotesquePro] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-[BasisGrotesquePro] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {/* Date filters commented out
        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
          placeholder="From Date"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-[BasisGrotesquePro] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          type="date"
          value={filters.date_to}
          onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
          placeholder="To Date"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-[BasisGrotesquePro] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        */}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">No appointments found</p>
        </div>
      ) : (
        <>
          {/* Calculate pagination */}
          {(() => {
            const totalPages = Math.ceil(appointments.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedAppointments = appointments.slice(startIndex, endIndex);
            const showPagination = appointments.length > itemsPerPage;

            return (
              <>
                <div className="space-y-4">
                  {paginatedAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-b-0">
                      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                        {getIcon(appointment)}
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-gray-900 font-[BasisGrotesquePro] mb-1">
                          {appointment.subject || 'Appointment'}
                        </p>
                        <p className="text-sm text-gray-500 font-[BasisGrotesquePro] mb-1">
                          {appointment.formatted_datetime || `${appointment.appointment_date?.display || ''} at ${appointment.appointment_time?.display || ''}`}
                        </p>
                        {appointment.appointment_with && (
                          <p className="text-xs text-gray-400 font-[BasisGrotesquePro] mb-1">
                            With: {appointment.appointment_with.name} ({appointment.appointment_with.role})
                          </p>
                        )}
                        {appointment.appointment_type && (
                          <p className="text-xs text-gray-400 font-[BasisGrotesquePro] mb-1">
                            Type: {appointment.appointment_type.display}
                          </p>
                        )}
                        {/* Meeting type commented out
                        {appointment.meeting_type && (
                          <p className="text-xs text-gray-400 font-[BasisGrotesquePro] mb-1">
                            Meeting: {appointment.meeting_type.display}
                            {appointment.meeting_url && (
                              <a href={appointment.meeting_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                                Join
                              </a>
                            )}
                          </p>
                        )}
                        */}
                        {appointment.description && (
                          <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-1">
                            {appointment.description}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`px-3 py-1 text-xs font-medium !rounded-[20px] ${getStatusColor(appointment.status)} font-[BasisGrotesquePro]`}>
                          {appointment.status?.display || appointment.status?.value || 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {showPagination && (
                  <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                    <div className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                      Showing {startIndex + 1} to {Math.min(endIndex, appointments.length)} of {appointments.length} appointments
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro]"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg font-[BasisGrotesquePro] ${currentPage === page
                                    ? 'bg-[#F56D2D] text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                  }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <span key={page} className="px-2 text-gray-500">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro]"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </>
      )}

      {/* Schedule Appointment Modal */}
      {showScheduleModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1070] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowScheduleModal(false);
            }
          }}
        >
          <div className="bg-white rounded-lg !border border-[#E8F0FF] w-full max-w-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-[#E8F0FF]">
              <div>
                <h5 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
                  Create Appointment
                </h5>
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                  Create a new appointment for {client?.name || 'client'}
                </p>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                  <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Event Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={scheduleForm.event_title}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, event_title: e.target.value })}
                  placeholder="Enter appointment title"
                  className="w-full px-3 py-2 text-sm !border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={scheduleForm.appointment_date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, appointment_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm !border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                    Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.appointment_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, appointment_time: e.target.value })}
                    className="w-full px-3 py-2 text-sm !border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={scheduleForm.duration}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, duration: parseInt(e.target.value) || 30 })}
                  min="15"
                  step="15"
                  className="w-full px-3 py-2 text-sm !border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro]"
                />
              </div>

              {/* Meeting Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                  Meeting Type
                </label>
                <select
                  value={scheduleForm.meeting_type}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, meeting_type: e.target.value })}
                  className="w-full px-3 py-2 text-sm !border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro] bg-white"
                >
                  <option value="zoom">Zoom</option>
                  <option value="google_meet">Google Meet</option>
                  <option value="in_person">In Person</option>
                  <option value="on_call">Phone Call</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                  Description
                </label>
                <textarea
                  value={scheduleForm.description}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                  placeholder="Add appointment notes or description..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm !border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro] resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#E8F0FF]">
              <button
                onClick={() => setShowScheduleModal(false)}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleAppointment}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white !rounded-lg hover:opacity-90 transition font-[BasisGrotesquePro] disabled:opacity-50"
                style={{ backgroundColor: '#178109' }}
              >
                {submitting ? 'Creating...' : 'Create Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
