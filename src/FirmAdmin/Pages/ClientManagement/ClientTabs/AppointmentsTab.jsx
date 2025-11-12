import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';

const API_BASE_URL = getApiBaseUrl();

export default function AppointmentsTab({ client }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
          <rect width="27" height="27" rx="8" fill="#E8F0FF"/>
          <g clipPath="url(#clip0_2277_7952)">
            <path d="M19.75 12.9247V13.4997C19.7492 14.8474 19.3128 16.1588 18.5058 17.2383C17.6989 18.3178 16.5646 19.1075 15.2721 19.4896C13.9796 19.8717 12.5983 19.8259 11.334 19.3588C10.0698 18.8917 8.99041 18.0285 8.25685 16.8978C7.52329 15.7672 7.17487 14.4297 7.26355 13.0849C7.35223 11.74 7.87325 10.4599 8.74892 9.43534C9.6246 8.41081 10.808 7.69679 12.1226 7.39976C13.4372 7.10274 14.8127 7.23863 16.0438 7.78717M11.625 12.8747L13.5 14.7497L19.75 8.49967" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
          <defs>
            <clipPath id="clip0_2277_7952">
              <rect width="15" height="15" fill="white" transform="translate(6 6)"/>
            </clipPath>
          </defs>
        </svg>
      );
    }
    
    if (statusValue === 'pending' || iconType === 'info') {
      return (
        <svg width="40" height="40" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="27" height="27" rx="8" fill="#E8F0FF"/>
          <g clipPath="url(#clip0_2277_7959)">
            <path d="M13.5 11V13.5M13.5 16H13.5063M19.75 13.5C19.75 16.9518 16.9518 19.75 13.5 19.75C10.0482 19.75 7.25 16.9518 7.25 13.5C7.25 10.0482 10.0482 7.25 13.5 7.25C16.9518 7.25 19.75 10.0482 19.75 13.5Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
          <defs>
            <clipPath id="clip0_2277_7959">
              <rect width="15" height="15" fill="white" transform="translate(6 6)"/>
            </clipPath>
          </defs>
        </svg>
      );
    }
    
    // Default calendar icon
    return (
      <svg width="40" height="40" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="27" height="27" rx="8" fill="#E8F0FF"/>
        <path d="M11 7.25V9.75M16 7.25V9.75M7.875 12.25H19.125M9.125 8.5H17.875C18.5654 8.5 19.125 9.05964 19.125 9.75V18.5C19.125 19.1904 18.5654 19.75 17.875 19.75H9.125C8.43464 19.75 7.875 19.1904 7.875 18.5V9.75C7.875 9.05964 8.43464 8.5 9.125 8.5Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round"/>
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
      <div className="mb-6">
        <h5 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-2">Appointments</h5>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Scheduled meetings and consultations</p>
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
                                className={`px-3 py-2 text-sm font-medium rounded-lg font-[BasisGrotesquePro] ${
                                  currentPage === page
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
    </div>
  );
}
