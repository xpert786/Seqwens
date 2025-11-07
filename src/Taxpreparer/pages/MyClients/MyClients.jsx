import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { AwaitingIcon, CompletedIcon, Dot, DoubleUserIcon, FaildIcon, FiltIcon, Phone } from "../../component/icons";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
import "../../styles/MyClients.css";

export default function MyClients() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRefs = useRef({});
  const navigate = useNavigate();

  // API state
  const [clients, setClients] = useState([]);
  const [overview, setOverview] = useState({
    total_clients: 0,
    active: 0,
    pending: 0,
    high_priority: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null); // null = all, "active", "pending"
  const [priorityFilter, setPriorityFilter] = useState(null); // null = all, "high", "medium", "low"
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Fetch clients from API
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      if (priorityFilter) {
        params.append('priority', priorityFilter);
      }

      const queryString = params.toString();
      const url = `${API_BASE_URL}/taxpayer/tax-preparer/clients/${queryString ? `?${queryString}` : ''}`;

      const config = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      console.log('Fetching clients from:', url);

      const response = await fetchWithCors(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Clients API response:', result);

      if (result.success && result.data) {
        setClients(result.data.clients || []);
        setOverview(result.data.overview || {
          total_clients: 0,
          active: 0,
          pending: 0,
          high_priority: 0
        });
      } else {
        throw new Error(result.message || 'Failed to fetch clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError(handleAPIError(error));
      setClients([]);
      setOverview({
        total_clients: 0,
        active: 0,
        pending: 0,
        high_priority: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch clients on component mount and when filters change
  useEffect(() => {
    fetchClients();
  }, [searchQuery, statusFilter, priorityFilter]);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      for (let id in dropdownRefs.current) {
        if (dropdownRefs.current[id] && !dropdownRefs.current[id].contains(event.target)) {
          setOpenDropdown(null);
        }
      }
      // Close filter dropdown if clicking outside
      if (showFilterDropdown && !event.target.closest('.filter-dropdown-container')) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilterDropdown]);

  // Prepare card data from overview stats
  const cardData = [
    { label: "Total Clients", icon: <DoubleUserIcon />, count: overview.total_clients, color: "#00bcd4" },
    { label: "Active", icon: <CompletedIcon />, count: overview.active, color: "#4caf50" },
    { label: "Pending", icon: <AwaitingIcon />, count: overview.pending, color: "#3f51b5" },
    { label: "High Priority", icon: <FaildIcon />, count: overview.high_priority, color: "#EF4444" },
  ];

  // Process client data for display
  const processedClients = clients.map(client => {
    // Build statuses array from API data
    const statuses = [];
    if (client.status) {
      statuses.push(client.status.charAt(0).toUpperCase() + client.status.slice(1));
    }
    if (client.priority) {
      const priorityLabel = client.priority === 'high' ? 'High Priority' :
        client.priority === 'medium' ? 'Medium' :
          client.priority;
      statuses.push(priorityLabel);
    }
    // Add client tags
    if (client.client_tags && Array.isArray(client.client_tags)) {
      statuses.push(...client.client_tags);
    }

    return {
      ...client,
      name: client.full_name || `${client.first_name} ${client.last_name}`,
      phone: client.phone_number || '',
      statuses: statuses,
      tasks: client.pending_tasks_count || 0,
      documents: client.documents_count || 0,
      due: client.next_due_date || null,
      initials: client.initials || `${client.first_name?.[0] || ''}${client.last_name?.[0] || ''}`.toUpperCase()
    };
  });

  const getBadgeStyle = (status) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "active":
        return "badge-active";
      case "pending":
      case "new":
      case "medium":
        return "badge-pending";
      case "high priority":
      case "high":
        return "badge-higher";
      case "low":
      case "low priority":
        return "badge-default";
      default:
        return "badge-default";
    }
  };

  // Handle search input change with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  // Handle filter changes
  const handleStatusFilter = (status) => {
    setStatusFilter(status === statusFilter ? null : status);
    setShowFilterDropdown(false);
  };

  const handlePriorityFilter = (priority) => {
    setPriorityFilter(priority === priorityFilter ? null : priority);
    setShowFilterDropdown(false);
  };

  const clearFilters = () => {
    setStatusFilter(null);
    setPriorityFilter(null);
    setSearchQuery("");
    setShowFilterDropdown(false);
  };

  if (loading) {
    return (
      <div className="myclients-container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading clients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="myclients-container">
        <div className="alert alert-danger" role="alert">
          <strong>Error:</strong> {error}
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={fetchClients}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="myclients-container">
      {/* Header */}
      <div className="header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-semibold">My Clients</h3>
          <small className="text-muted">Manage your assigned clients</small>
        </div>
        <span className="badge bg-light text-dark p-2">{overview.total_clients} clients</span>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-3">
        {cardData.map((item, index) => (
          <div className="col-md-3 col-sm-6" key={index}>
            <div className="stat-card ">
              <div className="d-flex justify-content-between align-items-center">
                <div className="stat-icon" style={{ color: item.color }}>
                  {item.icon}
                </div>
                <div className="stat-count">{item.count}</div>
              </div>
              <div className="mt-2">
                <p className="mb-0 text-muted small fw-semibold">{item.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="d-flex align-items-center gap-2 mb-3 mt-3" style={{ flexWrap: 'nowrap', alignItems: 'center' }}>
        <div className="position-relative " style={{ width: '260px', flexShrink: 0 }}>
          <input
            type="text"
            className="form-control rounded"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
              paddingLeft: "38px",
              paddingRight: "12px",
              paddingTop: "10px",
              paddingBottom: "8px",
              width: "100%",
              height: "38px",
              fontSize: "14px",
              lineHeight: "22px"
            }}
          />
          <svg
            width="14"
            height="14"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="search-icon"
            style={{
              position: 'absolute',
              left: '14px',
              top: '12px',
              zIndex: 10,
              pointerEvents: 'none'
            }}
          >
            <path d="M11 11L8.49167 8.49167M9.83333 5.16667C9.83333 7.74399 7.74399 9.83333 5.16667 9.83333C2.58934 9.83333 0.5 7.74399 0.5 5.16667C0.5 2.58934 2.58934 0.5 5.16667 0.5C7.74399 0.5 9.83333 2.58934 9.83333 5.16667Z" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="position-relative filter-dropdown-container" style={{ display: 'flex', alignItems: 'center' }}>
          <button
            className="btn btn-filter d-flex align-items-center justify-content-center rounded px-3"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            style={{
              border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
              background: "#fff",
              height: "38px",
              paddingLeft: "38px",
              paddingRight: "12px",
              paddingTop: "10px",
              paddingBottom: "8px",
              fontSize: "14px",
              lineHeight: "22px",
              marginTop: "-9px",
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FiltIcon className="me-2 text-muted" style={{ fontSize: "14px" }} />
            <span>Filter</span>
            {(statusFilter || priorityFilter) && (
              <span className="badge bg-danger ms-2" style={{ fontSize: "10px" }}>
                {(statusFilter ? 1 : 0) + (priorityFilter ? 1 : 0)}
              </span>
            )}
          </button>
          {showFilterDropdown && (
            <div
              className="card shadow-sm"
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                zIndex: 1000,
                minWidth: "200px",
                marginTop: "8px",
                padding: "12px"
              }}
            >
              <div className="mb-2">
                <label className="form-label small fw-semibold">Status</label>
                <div className="d-flex flex-column gap-1">
                  <button
                    className={`btn btn-sm ${statusFilter === null ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handleStatusFilter(null)}
                  >
                    All
                  </button>
                  <button
                    className={`btn btn-sm ${statusFilter === 'active' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handleStatusFilter('active')}
                  >
                    Active
                  </button>
                  <button
                    className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handleStatusFilter('pending')}
                  >
                    Pending
                  </button>
                </div>
              </div>
              <div className="mb-2">
                <label className="form-label small fw-semibold">Priority</label>
                <div className="d-flex flex-column gap-1">
                  <button
                    className={`btn btn-sm ${priorityFilter === null ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handlePriorityFilter(null)}
                  >
                    All
                  </button>
                  <button
                    className={`btn btn-sm ${priorityFilter === 'high' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handlePriorityFilter('high')}
                  >
                    High
                  </button>
                  <button
                    className={`btn btn-sm ${priorityFilter === 'medium' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handlePriorityFilter('medium')}
                  >
                    Medium
                  </button>
                  <button
                    className={`btn btn-sm ${priorityFilter === 'low' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handlePriorityFilter('low')}
                  >
                    Low
                  </button>
                </div>
              </div>
              {(statusFilter || priorityFilter || searchQuery) && (
                <button
                  className="btn btn-sm btn-outline-danger w-100 mt-2"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Client List Card */}
      <div className="card client-list-card p-3" style={{
        border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
      }}>
        <h6 className="fw-semibold mb-3">Client List</h6>
        <div className="mb-3">All clients assigned to you</div>

        {processedClients.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No clients found</p>
            {(searchQuery || statusFilter || priorityFilter) && (
              <button className="btn btn-sm btn-outline-primary mt-2" onClick={clearFilters}>
                Clear filters to see all clients
              </button>
            )}
          </div>
        ) : (
          <div className="row g-3">
            {processedClients.map((client) => (
              <div key={client.id} className="col-md-6 col-12">
                <div
                  className="card client-card"
                  style={{
                    border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)"
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    {/* Left */}
                    <div className="d-flex gap-3">
                      <div className="client-initials">
                        {client.initials}
                      </div>
                      <div>
                        <h6 className="mb-1 fw-semibold">{client.name}</h6>
                        <div className="client-contact-info">
                          <small className="text-muted client-email">
                            {client.email}
                          </small>
                          {client.phone && (
                            <small className="text-muted client-phone">
                              <Phone /> {client.phone}
                            </small>
                          )}
                        </div>
                        <div className="info-left">
                          <span className="info-item">{client.tasks} pending tasks</span>
                          <span className="info-item">{client.documents} documents</span>
                          {client.due && (
                            <span className="info-item">Due: {client.due}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Info + Dot Dropdown */}
                    <div className="info-row" style={{ position: 'relative', alignSelf: 'flex-start' }}>
                      <div className="info-right" style={{ position: 'relative' }}>
                        <div
                          className="dot-container"
                          ref={el => dropdownRefs.current[client.id] = el}
                          onClick={() =>
                            setOpenDropdown(openDropdown === client.id ? null : client.id)
                          }
                          style={{ position: 'relative' }}
                        >
                          <Dot />
                          {openDropdown === client.id && (
                            <ul className="dot-dropdown" style={{ position: 'absolute', top: '100%', right: '0', marginTop: '8px' }}>
                              <li onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/taxdashboard/clients/${client.id}`, { state: { client } });
                              }}>
                                View Details
                              </li>
                              <li onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/taxdashboard/clients/${client.id}`, { state: { client, tab: 'tasks' } });
                              }}>
                                View Tasks
                              </li>
                              <li onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/taxdashboard/clients/${client.id}`, { state: { client, tab: 'documents' } });
                              }}>
                                Documents
                              </li>
                              <li>Send Message</li>
                              <li>Schedule Meeting</li>
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
