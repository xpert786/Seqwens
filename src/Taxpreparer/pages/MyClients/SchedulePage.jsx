import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { Calender, MiniClock, PhoneMiniIcon, MiniDocument, MiniContact, FiltIcon } from "../../component/icons";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
import { BsCameraVideo } from "react-icons/bs";

export default function SchedulePage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState([]);
  const [clientInfo, setClientInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch upcoming appointments from API
  const fetchUpcomingAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const url = `${API_BASE_URL}/taxpayer/clients/${clientId}/appointments/upcoming/`;

      const config = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      console.log('Fetching upcoming appointments from:', url);

      const response = await fetchWithCors(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Upcoming appointments API response:', result);

      if (result.success && result.data) {
        setAppointments(result.data.appointments || []);
        setClientInfo(result.data.client || null);
      } else {
        throw new Error(result.message || 'Failed to fetch upcoming appointments');
      }
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      setError(handleAPIError(error));
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchUpcomingAppointments();
    }
  }, [clientId]);

  // Filter appointments based on search query
  const filteredAppointments = appointments.filter(appointment => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      appointment.subject?.toLowerCase().includes(query) ||
      appointment.description?.toLowerCase().includes(query) ||
      appointment.appointment_with?.name?.toLowerCase().includes(query) ||
      appointment.meeting_type_display?.toLowerCase().includes(query)
    );
  });

  const handleCardClick = (item) => {
    // Navigate to appointment details or handle click
    // navigate(`/taxdashboard/appointments/${item.id}`);
  };

  const handleJoinMeeting = (meetingUrl, e) => {
    e.stopPropagation();
    if (meetingUrl) {
      window.open(meetingUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="mt-6">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading appointments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6">
        <div className="alert alert-danger" role="alert">
          <strong>Error:</strong> {error}
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={fetchUpcomingAppointments}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Search and Filter */}
      <div className="d-flex align-items-center gap-2 mb-3 mt-3">
        <div className="position-relative search-box flex-grow-1">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            className="form-control ps-5 rounded mt-2" 
            placeholder="Search appointments..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
            }} 
          />
        </div>
        
        <button 
          className="btn btn-filter d-flex align-items-center rounded px-4" 
          style={{
            border: "none",
          }}
        >
          <FiltIcon className="me-3 text-muted" />
          <span className="ms-1">Filter</span>
        </button>
      </div>
      
      <div className="bg-white rounded-xl mt-6 p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-semibold" style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)" }}>
              {clientInfo?.name ? `${clientInfo.name}'s Upcoming Appointments` : 'Upcoming Appointments'}
            </div>
            <div className="text-xs text-gray-500">
              {filteredAppointments.length} {filteredAppointments.length === 1 ? 'appointment' : 'appointments'} scheduled
            </div>
          </div>
        </div>

        {filteredAppointments.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3">
            {filteredAppointments.map((appointment) => {
              const isConfirmed = appointment.status === "confirmed" || appointment.status_display === "Confirmed";
              const badgeStyle = isConfirmed
                ? { background: "#DCFCE7", color: "#166534", border: "0.5px solid #166534" }
                : { background: "#FEF9C3", color: "#854D0E", border: "0.5px solid #854D0E" };
              
              const meetingUrl = appointment.meeting_url || appointment.zoom_meeting_link || appointment.google_meet_link;
              const hasMeetingLink = !!meetingUrl;
              
              return (
                <div
                  key={appointment.id}
                  className="rounded-xl p-4 border cursor-pointer hover:shadow-md transition-shadow"
                  style={{
                    background: "#FFFFFF",
                    borderColor: "var(--Palette2-Dark-blue-100, #E8F0FF)",
                  }}
                  onClick={() => handleCardClick(appointment)}
                >
                  {/* Heading with inline status badge */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold" style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)" }}>
                        {appointment.subject || 'Appointment'}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={badgeStyle}>
                        {appointment.status_display || appointment.status || 'pending'}
                      </span>
                    </div>
                    {hasMeetingLink && (
                      <button
                        className="btn btn-sm"
                        style={{ 
                          background: "#F56D2D", 
                          color: "#fff",
                          fontSize: "12px",
                          padding: "4px 12px"
                        }}
                        onClick={(e) => handleJoinMeeting(meetingUrl, e)}
                      >
                        <BsCameraVideo className="me-1" style={{ fontSize: "14px" }} />
                        Join Meeting
                      </button>
                    )}
                  </div>

                  {/* Details with icons */}
                  <div className="mt-2 text-xs text-gray-600">
                    {/* Row 1: date, time, method in one line */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1">
                        <Calender />
                        <span>{appointment.date || appointment.date_value}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MiniClock />
                        <span>{appointment.time_range || `${appointment.start_time} - ${appointment.end_time}`}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <PhoneMiniIcon />
                        <span>{appointment.meeting_type_display || appointment.meeting_location || 'N/A'}</span>
                      </span>
                    </div>
                    {/* Row 2: person and description on same line */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      {appointment.appointment_with && (
                        <span className="flex items-center gap-1">
                          <MiniContact />
                          <span>With: {appointment.appointment_with.name}</span>
                        </span>
                      )}
                      {appointment.description && (
                        <span className="flex items-center gap-1">
                          <MiniDocument />
                          <span>{appointment.description}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-5 mt-4">
            <p className="text-muted">
              {searchQuery ? 'No appointments found matching your search' : 'No upcoming appointments scheduled'}
            </p>
            {searchQuery && (
              <button 
                className="btn btn-sm btn-outline-primary mt-2" 
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
