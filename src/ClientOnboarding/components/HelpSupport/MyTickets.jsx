import { useState, useEffect } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { CrossIcon, ConversIcon } from "../icons";
import { supportTicketAPI, handleAPIError } from "../../utils/apiUtils";
import "../../styles/MyTickets.css";
import { toast } from "react-toastify";

const MyTickets = () => {
  const [selectedTicketBox, setSelectedTicketBox] = useState(null);
  const [openPopupTicket, setOpenPopupTicket] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicketDetails, setSelectedTicketDetails] = useState(null);
  const [loadingTicketDetails, setLoadingTicketDetails] = useState(false);
  const isTicketSendActive = messageInput.trim().length > 0;
  const ticketSendButtonStyles = {
    background: isTicketSendActive ? "#F56D2D" : "#E5E7EB",
    color: isTicketSendActive ? "#fff" : "#9CA3AF",
    cursor: isTicketSendActive ? "pointer" : "not-allowed"
  };

  // Fetch support tickets from API
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        console.log('🔄 Fetching support tickets...');
        setLoading(true);
        setError(null);

        const response = await supportTicketAPI.getSupportTickets();
        console.log('📋 Support tickets API response:', response);

        if (response.success && response.data) {
          console.log('✅ Support tickets fetched successfully:', response.data);
          setTickets(response.data);
        } else {
          console.log('❌ Failed to fetch support tickets:', response.message);
          setError(response.message || 'Failed to fetch support tickets');
        }
      } catch (err) {
        console.error('💥 Error fetching support tickets:', err);
        const errorMsg = handleAPIError(err);
        setError(errorMsg);
      } finally {
        setLoading(false);
        console.log('🏁 Finished fetching support tickets');
      }
    };

    fetchTickets();
  }, []);

  // Function to refresh tickets (can be called after creating a new ticket)
  const refreshTickets = async () => {
    try {
      console.log('🔄 Refreshing support tickets...');
      const response = await supportTicketAPI.getSupportTickets();

      if (response.success && response.data) {
        console.log('✅ Support tickets refreshed:', response.data);
        setTickets(response.data);
      }
    } catch (err) {
      console.error('💥 Error refreshing support tickets:', err);
    }
  };

  // Expose refresh function to window for global access
  useEffect(() => {
    window.refreshSupportTickets = refreshTickets;
    return () => {
      delete window.refreshSupportTickets;
    };
  }, []);

  // Function to fetch ticket details
  const fetchTicketDetails = async (ticketId) => {
    try {
      console.log('🔄 Fetching ticket details for ID:', ticketId);
      setLoadingTicketDetails(true);

      const response = await supportTicketAPI.getSupportTicket(ticketId);
      console.log('📋 Ticket details API response:', response);

      if (response.success && response.data) {
        console.log('✅ Ticket details fetched successfully:', response.data);
        setSelectedTicketDetails(response.data);
      } else {
        console.log('❌ Failed to fetch ticket details:', response.message);
        setError(response.message || 'Failed to fetch ticket details');
      }
    } catch (err) {
      console.error('💥 Error fetching ticket details:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg);
    } finally {
      setLoadingTicketDetails(false);
    }
  };

  const closePopup = () => {
    setOpenPopupTicket(null);
    setSelectedTicketDetails(null);
  };

  // Handle View Details button click
  const handleViewDetails = async (ticket, index) => {
    setOpenPopupTicket(index);
    await fetchTicketDetails(ticket.id);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    // For now, just clear the input since we don't have a send message API
    // In a real implementation, you would call an API to send the message
    console.log('Sending message:', messageInput);
    setMessageInput("");

    // Show a message that this feature is not implemented yet
    toast.info('Message sending feature will be implemented soon!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      icon: false,
      className: "custom-toast-info",
      bodyClassName: "custom-toast-body",
    });
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "open") {
      return <span className="status-badge open">{status}</span>;
    } else if (statusLower === "resolved") {
      return <span className="status-badge resolved">{status}</span>;
    } else if (statusLower === "closed") {
      return <span className="status-badge resolved">{status}</span>;
    } else if (statusLower === "in_progress") {
      return <span className="status-badge in-progress">{status}</span>;
    }
    return <span className="status-badge open">{status}</span>;
  };

  const getPriorityBadge = (priority) => {
    const priorityLower = priority?.toLowerCase();
    if (priorityLower === "high") {
      return <span className="priority-badge high">{priority}</span>;
    } else if (priorityLower === "medium") {
      return <span className="priority-badge medium">{priority}</span>;
    } else if (priorityLower === "low") {
      return <span className="priority-badge low">{priority}</span>;
    }
    return <span className="priority-badge medium">{priority}</span>;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div className="tickets-header">
        <h5 className="tickets-title">My Support Tickets</h5>
        <p className="tickets-subtitle">Track your support requests</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading support tickets...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* No Tickets State */}
      {!loading && !error && tickets.length === 0 && (
        <div className="text-center py-4">
          <p className="text-muted">No support tickets found. Create your first ticket!</p>
        </div>
      )}

      {/* Tickets List */}
      {!loading && !error && tickets.length > 0 && (
        <>
          {tickets.map((ticket, index) => (
            <div
              key={ticket.id || index}
              onClick={() => setSelectedTicketBox(index)}
              className={`ticket-box ${selectedTicketBox === index ? "active" : ""
                }`}
            >
              <div>
                <div className="ticket-info">
                  <span className="ticket-id">{ticket.ticket_number || ticket.id}</span>
                  {getStatusBadge(ticket.status)}
                  {getPriorityBadge(ticket.priority)}
                </div>

                <div className="ticket-title">{ticket.subject}</div>
                <div className="ticket-dates">
                  Created: {formatDate(ticket.created_at)} &nbsp;&nbsp;|&nbsp;&nbsp; Last update:{" "}
                  {formatDate(ticket.updated_at)}
                </div>
                <div className="ticket-category">
                  Category: {ticket.category?.charAt(0).toUpperCase() + ticket.category?.slice(1) || 'N/A'}
                </div>
              </div>
              <button
                className="view-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails(ticket, index);
                }}
              >
                View Details
              </button>
            </div>
          ))}
        </>
      )}

      {/* popup view details click */}

      {openPopupTicket !== null && (
        <div className="ticket-popup-overlay">
          <div className="ticket-popup-box">

            <div className="ticket-popup-header">
              <h6 className="ticket-popup-title">
                Ticket Details - {selectedTicketDetails?.ticket_number || tickets[openPopupTicket]?.ticket_number || tickets[openPopupTicket]?.id}
              </h6>
              <button className="ticket-popup-close" onClick={closePopup}>
                <CrossIcon />
              </button>
            </div>
            <p className="ticket-popup-sub">
              View and respond to your support ticket
            </p>

            {/* Loading State for Ticket Details */}
            {loadingTicketDetails && (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading ticket details...</p>
              </div>
            )}

            {/* Ticket Details Content */}
            {!loadingTicketDetails && selectedTicketDetails && (
              <div className="ticket-issue-box">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong className="ticket-issue-title">
                    {selectedTicketDetails.subject}
                  </strong>
                  <div className="d-flex align-items-center" style={{ marginLeft: "300px" }}>
                    {getStatusBadge(selectedTicketDetails.status)}
                    {getPriorityBadge(selectedTicketDetails.priority)}
                  </div>
                </div>
                <p className="ticket-issue-text">{selectedTicketDetails.description}</p>

                <div className="d-flex justify-content-between">
                  <div>
                    <div className="ticket-meta">Category:</div>
                    <div className="ticket-meta-value">
                      {selectedTicketDetails.category?.charAt(0).toUpperCase() + selectedTicketDetails.category?.slice(1) || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="ticket-meta">Created:</div>
                    <div className="ticket-meta-value">{formatDate(selectedTicketDetails.created_at)}</div>
                  </div>
                  <div>
                    <div className="ticket-meta">Last Update:</div>
                    <div className="ticket-meta-value">{formatDate(selectedTicketDetails.updated_at)}</div>
                  </div>
                  <div>
                    <div className="ticket-meta">User:</div>
                    <div className="ticket-meta-value">{selectedTicketDetails.user_name || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Fallback to basic ticket info if details not loaded */}
            {!loadingTicketDetails && !selectedTicketDetails && (
              <div className="ticket-issue-box">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong className="ticket-issue-title">
                    {tickets[openPopupTicket]?.subject}
                  </strong>
                  <div className="d-flex align-items-center" style={{ marginLeft: "300px" }}>
                    {getStatusBadge(tickets[openPopupTicket]?.status)}
                    {getPriorityBadge(tickets[openPopupTicket]?.priority)}
                  </div>
                </div>
                <p className="ticket-issue-text">
                  {tickets[openPopupTicket]?.description || 'No description available'}
                </p>

                <div className="d-flex justify-content-between">
                  <div>
                    <div className="ticket-meta">Category:</div>
                    <div className="ticket-meta-value">
                      {tickets[openPopupTicket]?.category?.charAt(0).toUpperCase() + tickets[openPopupTicket]?.category?.slice(1) || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="ticket-meta">Created:</div>
                    <div className="ticket-meta-value">{formatDate(tickets[openPopupTicket]?.created_at)}</div>
                  </div>
                  <div>
                    <div className="ticket-meta">Last Update:</div>
                    <div className="ticket-meta-value">{formatDate(tickets[openPopupTicket]?.updated_at)}</div>
                  </div>
                  <div>
                    <div className="ticket-meta">Ticket Number:</div>
                    <div className="ticket-meta-value">{tickets[openPopupTicket]?.ticket_number || tickets[openPopupTicket]?.id}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default MyTickets;

