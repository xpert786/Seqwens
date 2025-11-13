import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaPlus, FaUserPlus, FaEnvelope, FaSms, FaLink, FaCopy } from "react-icons/fa";
import { AwaitingIcon, CompletedIcon, Dot, DoubleUserIcon, FaildIcon, FiltIcon, Phone } from "../../component/icons";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError, taxPreparerClientAPI } from "../../../ClientOnboarding/utils/apiUtils";
import { toast } from "react-toastify";
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

  // Create/Invite taxpayer modals state
  const [showCreateTaxpayerModal, setShowCreateTaxpayerModal] = useState(false);
  const [showInviteTaxpayerModal, setShowInviteTaxpayerModal] = useState(false);
  const [showInviteConfirmationModal, setShowInviteConfirmationModal] = useState(false);
  const [newlyCreatedTaxpayerId, setNewlyCreatedTaxpayerId] = useState(null);
  const [createTaxpayerLoading, setCreateTaxpayerLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  
  // Create taxpayer form state
  const [createTaxpayerForm, setCreateTaxpayerForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    filing_status: "",
    tags: []
  });

  // Invite taxpayer state
  const [inviteMethod, setInviteMethod] = useState("email"); // "email", "sms", "link"
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteLink, setInviteLink] = useState("");

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

  // Handle create taxpayer form changes
  const handleCreateTaxpayerChange = (field, value) => {
    setCreateTaxpayerForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Create taxpayer
  const handleCreateTaxpayer = async (e) => {
    e.preventDefault();
    
    if (!createTaxpayerForm.first_name || !createTaxpayerForm.last_name || !createTaxpayerForm.email) {
      toast.error("Please fill in all required fields (First Name, Last Name, Email)", {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }

    try {
      setCreateTaxpayerLoading(true);
      const response = await taxPreparerClientAPI.createTaxpayer(createTaxpayerForm);
      
      if (response.success && response.data) {
        const newClientId = response.data.id || response.data.client_id;
        setNewlyCreatedTaxpayerId(newClientId);
        setShowCreateTaxpayerModal(false);
        setShowInviteConfirmationModal(true);
        
        // Reset form
        setCreateTaxpayerForm({
          first_name: "",
          last_name: "",
          email: "",
          phone_number: "",
          filing_status: "",
          tags: []
        });
        
        // Refresh clients list
        fetchClients();
        
        toast.success("Taxpayer created successfully!", {
          position: "top-right",
          autoClose: 3000
        });
      } else {
        throw new Error(response.message || "Failed to create taxpayer");
      }
    } catch (error) {
      console.error("Error creating taxpayer:", error);
      toast.error(handleAPIError(error), {
        position: "top-right",
        autoClose: 3000
      });
    } finally {
      setCreateTaxpayerLoading(false);
    }
  };

  // Generate invite link
  const handleGenerateInviteLink = async (clientId) => {
    try {
      setInviteLoading(true);
      const response = await taxPreparerClientAPI.generateInviteLink(clientId);
      
      if (response.success && response.data) {
        const link = response.data.invite_link || response.data.link;
        setInviteLink(link);
        setInviteMethod("link");
        
        // Copy to clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(link);
          toast.success("Invite link copied to clipboard!", {
            position: "top-right",
            autoClose: 2000
          });
        }
      } else {
        throw new Error(response.message || "Failed to generate invite link");
      }
    } catch (error) {
      console.error("Error generating invite link:", error);
      toast.error(handleAPIError(error), {
        position: "top-right",
        autoClose: 3000
      });
    } finally {
      setInviteLoading(false);
    }
  };

  // Send email invite
  const handleSendEmailInvite = async (clientId, email) => {
    try {
      setInviteLoading(true);
      const response = await taxPreparerClientAPI.inviteTaxpayerEmail(clientId, {
        email: email || inviteEmail
      });
      
      if (response.success) {
        toast.success("Email invite sent successfully!", {
          position: "top-right",
          autoClose: 3000
        });
        setShowInviteTaxpayerModal(false);
        setShowInviteConfirmationModal(false);
        setInviteEmail("");
      } else {
        throw new Error(response.message || "Failed to send email invite");
      }
    } catch (error) {
      console.error("Error sending email invite:", error);
      toast.error(handleAPIError(error), {
        position: "top-right",
        autoClose: 3000
      });
    } finally {
      setInviteLoading(false);
    }
  };

  // Send SMS invite
  const handleSendSMSInvite = async (clientId, phone) => {
    try {
      setInviteLoading(true);
      const response = await taxPreparerClientAPI.inviteTaxpayerSMS(clientId, {
        phone_number: phone || invitePhone
      });
      
      if (response.success) {
        toast.success("SMS invite sent successfully!", {
          position: "top-right",
          autoClose: 3000
        });
        setShowInviteTaxpayerModal(false);
        setShowInviteConfirmationModal(false);
        setInvitePhone("");
      } else {
        throw new Error(response.message || "Failed to send SMS invite");
      }
    } catch (error) {
      console.error("Error sending SMS invite:", error);
      toast.error(handleAPIError(error), {
        position: "top-right",
        autoClose: 3000
      });
    } finally {
      setInviteLoading(false);
    }
  };

  // Handle invite confirmation (send now or later)
  const handleInviteConfirmation = async (sendNow, method) => {
    if (!newlyCreatedTaxpayerId) {
      setShowInviteConfirmationModal(false);
      return;
    }

    if (sendNow) {
      // Show invite modal with selected method
      setInviteMethod(method || "email");
      setShowInviteConfirmationModal(false);
      setShowInviteTaxpayerModal(true);
    } else {
      // Just close the modal
      setShowInviteConfirmationModal(false);
      setNewlyCreatedTaxpayerId(null);
    }
  };

  const openClientDetails = (client, options = {}) => {
    setOpenDropdown(null);
    navigate(`/taxdashboard/clients/${client.id}`, { state: { client, ...options } });
  };

  const handleMenuSelect = (event, action, client) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setOpenDropdown(null);

    switch (action) {
      case "details":
        openClientDetails(client);
        break;
      case "tasks":
        navigate("/taxdashboard/tasks", { state: { clientId: client.id, client } });
        break;
      case "documents":
        navigate("/taxdashboard/documents", { state: { clientId: client.id, client } });
        break;
      case "messages":
        navigate("/taxdashboard/messages", { state: { clientId: client.id, client } });
        break;
      case "schedule":
        navigate("/taxdashboard/calendar", { state: { clientId: client.id, client } });
        break;
      default:
        break;
    }
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
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-light text-dark p-2">{overview.total_clients} clients</span>
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => setShowInviteTaxpayerModal(true)}
            style={{
              backgroundColor: "#00C0C6",
              borderColor: "#00C0C6",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            <FaUserPlus size={14} />
            Invite Taxpayer
          </button>
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => setShowCreateTaxpayerModal(true)}
            style={{
              backgroundColor: "#FF7A2F",
              borderColor: "#FF7A2F",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            <FaPlus size={14} />
            Create Taxpayer
          </button>
        </div>
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
                  role="button"
                  tabIndex={0}
                  onClick={() => openClientDetails(client)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openClientDetails(client);
                    }
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    {/* Left */}
                    <div className="d-flex gap-3">
                      <button
                        type="button"
                        className="client-initials"
                        onClick={(event) => {
                          event.stopPropagation();
                          openClientDetails(client);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            event.stopPropagation();
                            openClientDetails(client);
                          }
                        }}
                        aria-label={`Open ${client.name} details`}
                      >
                        {client.initials}
                      </button>
                      <div>
                        <button
                          type="button"
                          className="client-name-button fw-semibold"
                          onClick={(event) => {
                            event.stopPropagation();
                            openClientDetails(client);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              event.stopPropagation();
                              openClientDetails(client);
                            }
                          }}
                        >
                          {client.name}
                        </button>
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
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenDropdown(openDropdown === client.id ? null : client.id);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              event.stopPropagation();
                              setOpenDropdown(openDropdown === client.id ? null : client.id);
                            }
                          }}
                          tabIndex={0}
                          style={{ position: 'relative' }}
                        >
                          <Dot />
                          {openDropdown === client.id && (
                            <ul className="dot-dropdown" style={{ position: 'absolute', top: '100%', right: '0', marginTop: '8px' }}>
                              <li
                                onMouseDown={(e) => handleMenuSelect(e, "details", client)}
                                onClick={(e) => handleMenuSelect(e, "details", client)}
                                tabIndex={0}
                                role="button"
                              >
                                View Details
                              </li>
                              <li
                                onMouseDown={(e) => handleMenuSelect(e, "tasks", client)}
                                onClick={(e) => handleMenuSelect(e, "tasks", client)}
                                tabIndex={0}
                                role="button"
                              >
                                View Tasks
                              </li>
                              <li
                                onMouseDown={(e) => handleMenuSelect(e, "documents", client)}
                                onClick={(e) => handleMenuSelect(e, "documents", client)}
                                tabIndex={0}
                                role="button"
                              >
                                Documents
                              </li>
                              <li
                                onMouseDown={(e) => handleMenuSelect(e, "messages", client)}
                                onClick={(e) => handleMenuSelect(e, "messages", client)}
                                tabIndex={0}
                                role="button"
                              >
                                Send Message
                              </li>
                              <li
                                onMouseDown={(e) => handleMenuSelect(e, "schedule", client)}
                                onClick={(e) => handleMenuSelect(e, "schedule", client)}
                                tabIndex={0}
                                role="button"
                              >
                                Schedule Meeting
                              </li>
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

      {/* Create Taxpayer Modal */}
      {showCreateTaxpayerModal && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', maxWidth: '500px' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #E8F0FF' }}>
                <h5 className="modal-title fw-semibold" style={{ color: '#3B4A66' }}>Create New Taxpayer</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowCreateTaxpayerModal(false);
                    setCreateTaxpayerForm({
                      first_name: "",
                      last_name: "",
                      email: "",
                      phone_number: "",
                      filing_status: "",
                      tags: []
                    });
                  }}
                  aria-label="Close"
                ></button>
              </div>
              <form onSubmit={handleCreateTaxpayer}>
                <div className="modal-body" style={{ padding: '24px' }}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      First Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={createTaxpayerForm.first_name}
                      onChange={(e) => handleCreateTaxpayerChange('first_name', e.target.value)}
                      required
                      style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Last Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={createTaxpayerForm.last_name}
                      onChange={(e) => handleCreateTaxpayerChange('last_name', e.target.value)}
                      required
                      style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      value={createTaxpayerForm.email}
                      onChange={(e) => handleCreateTaxpayerChange('email', e.target.value)}
                      required
                      style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={createTaxpayerForm.phone_number}
                      onChange={(e) => handleCreateTaxpayerChange('phone_number', e.target.value)}
                      style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Filing Status</label>
                    <select
                      className="form-select"
                      value={createTaxpayerForm.filing_status}
                      onChange={(e) => handleCreateTaxpayerChange('filing_status', e.target.value)}
                      style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    >
                      <option value="">Select filing status</option>
                      <option value="single">Single</option>
                      <option value="married_joint">Married Filing Jointly</option>
                      <option value="married_separate">Married Filing Separately</option>
                      <option value="head_of_household">Head of Household</option>
                      <option value="qualifying_widow">Qualifying Widow(er)</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid #E8F0FF', padding: '16px 24px' }}>
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setShowCreateTaxpayerModal(false);
                      setCreateTaxpayerForm({
                        first_name: "",
                        last_name: "",
                        email: "",
                        phone_number: "",
                        filing_status: "",
                        tags: []
                      });
                    }}
                    style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={createTaxpayerLoading}
                    style={{
                      backgroundColor: '#FF7A2F',
                      borderColor: '#FF7A2F',
                      borderRadius: '8px'
                    }}
                  >
                    {createTaxpayerLoading ? 'Creating...' : 'Create Taxpayer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Invite Confirmation Modal (after creating taxpayer) */}
      {showInviteConfirmationModal && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', maxWidth: '400px' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #E8F0FF' }}>
                <h5 className="modal-title fw-semibold" style={{ color: '#3B4A66' }}>Taxpayer Created Successfully</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowInviteConfirmationModal(false);
                    setNewlyCreatedTaxpayerId(null);
                  }}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body" style={{ padding: '24px' }}>
                <p className="mb-4">Would you like to send an invite to this taxpayer now?</p>
                <div className="d-flex flex-column gap-2">
                  <button
                    className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                    onClick={() => handleInviteConfirmation(true, 'email')}
                    style={{
                      backgroundColor: '#00C0C6',
                      borderColor: '#00C0C6',
                      borderRadius: '8px',
                      padding: '10px'
                    }}
                  >
                    <FaEnvelope size={14} />
                    Send Email Invite
                  </button>
                  <button
                    className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                    onClick={() => handleInviteConfirmation(true, 'sms')}
                    style={{
                      backgroundColor: '#00C0C6',
                      borderColor: '#00C0C6',
                      borderRadius: '8px',
                      padding: '10px'
                    }}
                  >
                    <FaSms size={14} />
                    Send SMS Invite
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => handleInviteConfirmation(false)}
                    style={{ borderRadius: '8px', padding: '10px' }}
                  >
                    Invite Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Taxpayer Modal */}
      {showInviteTaxpayerModal && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', maxWidth: '500px' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #E8F0FF' }}>
                <h5 className="modal-title fw-semibold" style={{ color: '#3B4A66' }}>
                  {newlyCreatedTaxpayerId ? 'Invite Taxpayer' : 'Invite Existing Taxpayer'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowInviteTaxpayerModal(false);
                    setInviteMethod('email');
                    setInviteEmail('');
                    setInvitePhone('');
                    setInviteLink('');
                    setNewlyCreatedTaxpayerId(null);
                  }}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body" style={{ padding: '24px' }}>
                {!newlyCreatedTaxpayerId && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Select Client</label>
                    <select
                      className="form-select"
                      onChange={(e) => setNewlyCreatedTaxpayerId(e.target.value)}
                      style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    >
                      <option value="">Select a client to invite</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.full_name || `${client.first_name} ${client.last_name}`} - {client.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {newlyCreatedTaxpayerId && (
                  <>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Invite Method</label>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className={`btn ${inviteMethod === 'email' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setInviteMethod('email')}
                          style={{ borderRadius: '8px', flex: 1 }}
                        >
                          <FaEnvelope size={14} className="me-2" />
                          Email
                        </button>
                        <button
                          type="button"
                          className={`btn ${inviteMethod === 'sms' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setInviteMethod('sms')}
                          style={{ borderRadius: '8px', flex: 1 }}
                        >
                          <FaSms size={14} className="me-2" />
                          SMS
                        </button>
                        <button
                          type="button"
                          className={`btn ${inviteMethod === 'link' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => {
                            setInviteMethod('link');
                            handleGenerateInviteLink(newlyCreatedTaxpayerId);
                          }}
                          disabled={inviteLoading}
                          style={{ borderRadius: '8px', flex: 1 }}
                        >
                          <FaLink size={14} className="me-2" />
                          Link
                        </button>
                      </div>
                    </div>

                    {inviteMethod === 'email' && (
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Email Address</label>
                        <input
                          type="email"
                          className="form-control"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="Enter email address"
                          style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                        />
                      </div>
                    )}

                    {inviteMethod === 'sms' && (
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Phone Number</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={invitePhone}
                          onChange={(e) => setInvitePhone(e.target.value)}
                          placeholder="Enter phone number"
                          style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                        />
                      </div>
                    )}

                    {inviteMethod === 'link' && inviteLink && (
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Invite Link</label>
                        <div className="d-flex gap-2">
                          <input
                            type="text"
                            className="form-control"
                            value={inviteLink}
                            readOnly
                            style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              navigator.clipboard.writeText(inviteLink);
                              toast.success("Link copied to clipboard!", {
                                position: "top-right",
                                autoClose: 2000
                              });
                            }}
                            style={{ borderRadius: '8px' }}
                          >
                            <FaCopy size={14} />
                          </button>
                        </div>
                        <small className="text-muted">Link copied to clipboard. Share this link with the taxpayer.</small>
                      </div>
                    )}
                  </>
                )}
              </div>
              {newlyCreatedTaxpayerId && (
                <div className="modal-footer" style={{ borderTop: '1px solid #E8F0FF', padding: '16px 24px' }}>
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setShowInviteTaxpayerModal(false);
                      setInviteMethod('email');
                      setInviteEmail('');
                      setInvitePhone('');
                      setInviteLink('');
                      setNewlyCreatedTaxpayerId(null);
                    }}
                    style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  >
                    Cancel
                  </button>
                  {inviteMethod === 'email' && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleSendEmailInvite(newlyCreatedTaxpayerId)}
                      disabled={inviteLoading || !inviteEmail}
                      style={{
                        backgroundColor: '#00C0C6',
                        borderColor: '#00C0C6',
                        borderRadius: '8px'
                      }}
                    >
                      {inviteLoading ? 'Sending...' : 'Send Email Invite'}
                    </button>
                  )}
                  {inviteMethod === 'sms' && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleSendSMSInvite(newlyCreatedTaxpayerId)}
                      disabled={inviteLoading || !invitePhone}
                      style={{
                        backgroundColor: '#00C0C6',
                        borderColor: '#00C0C6',
                        borderRadius: '8px'
                      }}
                    >
                      {inviteLoading ? 'Sending...' : 'Send SMS Invite'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
