import { useState } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { CrossIcon, ConversIcon } from "../icons";
import "../../styles/MyTickets.css";

const MyTickets = () => {
  const [selectedTicketBox, setSelectedTicketBox] = useState(null);
  const [openPopupTicket, setOpenPopupTicket] = useState(null);
  const [messageInput, setMessageInput] = useState("");

  const [tickets, setTickets] = useState([
    {
      id: "TCK-001",
      status: "Open",
      priority: "Medium",
      title: "Unable to upload W2 document",
      description:
        "I’m having trouble uploading my W-2 document.to get stuck at 50% upload progress.",
      created: "Mar 12, 2024",
      updated: "Mar 13, 2024",
      category: "Technical",
      messages: [
        {
          sender: "Support Agent",
          role: "agent",
          text: "Hi Michael, I see you’re having upload issues. Can you try clearing your cache and uploading again?",
          date: "19/06/2025",
          time: "10:25 AM",
        },
        {
          sender: "Michael",
          role: "user",
          text: "I tried clearing the cache but still having the same issue. The file stops at 50%.",
          date: "19/06/2025",
          time: "10:30 AM",
        },
      ],
    },
    {
      id: "TCK-002",
      status: "Resolved",
      priority: "Low",
      title: "Question about direct deposit",
      description: "I have a question about my direct deposit details.",
      created: "Feb 28, 2024",
      updated: "Mar 1, 2024",
      category: "General",
      messages: [],
    },
  ]);

  const closePopup = () => setOpenPopupTicket(null);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    const newTickets = [...tickets];
    const now = new Date();

    const newMessage = {
      sender: "You",
      role: "user",
      text: messageInput,
      date: now.toLocaleDateString("en-GB"),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    newTickets[openPopupTicket].messages.push(newMessage);
    setTickets(newTickets);
    setMessageInput("");
  };

  const getStatusBadge = (status) => {
    if (status === "Open") {
      return <span className="status-badge open">{status}</span>;
    } else if (status === "Resolved") {
      return <span className="status-badge resolved">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    if (priority === "Medium") {
      return <span className="priority-badge medium">{priority}</span>;
    } else if (priority === "Low") {
      return <span className="priority-badge low">{priority}</span>;
    }
  };

  return (
    <div>
      <div className="tickets-header">
        <h5 className="tickets-title">My Support Tickets</h5>
        <p className="tickets-subtitle">Track your support requests</p>
      </div>

      {tickets.map((ticket, index) => (
        <div
          key={index}
          onClick={() => setSelectedTicketBox(index)}
          className={`ticket-box ${selectedTicketBox === index ? "active" : ""
            }`}
        >
          <div>
            <div className="ticket-info">
              <span className="ticket-id">{ticket.id}</span>
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>

            <div className="ticket-title">{ticket.title}</div>
            <div className="ticket-dates">
              Created: {ticket.created} &nbsp;&nbsp;|&nbsp;&nbsp; Last update:{" "}
              {ticket.updated}
            </div>
          </div>
          <button
            className="view-btn"
            onClick={(e) => {
              e.stopPropagation();
              setOpenPopupTicket(index);
            }}
          >
            View Details
          </button>
        </div>
      ))}

      {/* popup view details click */}

      {openPopupTicket !== null && (
        <div className="ticket-popup-overlay">
          <div className="ticket-popup-box">

   
            <div className="ticket-popup-header">
              <h6 className="ticket-popup-title">
                Ticket Details - {tickets[openPopupTicket].id}
              </h6>
              <button className="ticket-popup-close" onClick={closePopup}>
                <CrossIcon />
              </button>
            </div>
            <p className="ticket-popup-sub">
              View and respond to your support ticket
            </p>

            <div className="ticket-issue-box">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong className="ticket-issue-title">
                  {tickets[openPopupTicket].title}
                </strong>
                <div className="d-flex align-items-center" style={{ marginLeft: "300px" }}>
                  {getStatusBadge(tickets[openPopupTicket].status)}
                  {getPriorityBadge(tickets[openPopupTicket].priority)}
                </div>
              </div>
              <p className="ticket-issue-text">{tickets[openPopupTicket].description}</p>

            
              <div className="d-flex justify-content-between">
                <div>
                  <div className="ticket-meta">Category:</div>
                  <div className="ticket-meta-value">{tickets[openPopupTicket].category}</div>
                </div>
                <div>
                  <div className="ticket-meta">Created:</div>
                  <div className="ticket-meta-value">{tickets[openPopupTicket].created}</div>
                </div>
                <div>
                  <div className="ticket-meta">Last Update:</div>
                  <div className="ticket-meta-value">{tickets[openPopupTicket].updated}</div>
                </div>
                <div>
                  <div className="ticket-meta">Messages:</div>
                  <div className="ticket-meta-value">{tickets[openPopupTicket].messages.length}</div>
                </div>
              </div>
            </div>

         
            <div className="ticket-actions">
              <span>Quick Actions:</span>
              <button>Mark as Resolved</button>
              <button className="close-btn">Close Ticket</button>
            </div>

            <h6 className="ticket-popup-title" style={{ fontSize: "15px" }}>
              Conversation
            </h6>

          
            <div className="ticket-conversation">
              {tickets[openPopupTicket].messages.map((msg, idx) => (
                <div key={idx} className="mb-4">
             
                  <div
                    className={`d-flex ${msg.role === "agent" ? "justify-content-start" : "justify-content-end"
                      }`}
                  >
                    {msg.role === "agent" && (
                      <div className="msg-icon agent-icon">
                        <ConversIcon className="msg-icon-inner" />
                      </div>
                    )}

                    <div
                      className="p-3 rounded-3 msg-bubble"
                      style={{
                        backgroundColor: msg.role === "agent" ? "#FFF4E6" : "#F3F7FF",
                        border:
                          msg.role === "agent"
                            ? "1px solid #F49C2D"
                            : "1px solid #E8F0FF",
                      }}
                    >
                      <p className="ticket-message">{msg.text}</p>
                    </div>

                    {msg.role !== "agent" && (
                      <div className="msg-icon user-icon">
                        <ConversIcon className="msg-icon-inner" />
                      </div>
                    )}
                  </div>

                
                  <div
                    className="ticket-message-date"
                    style={{
                      justifyContent: msg.role === "agent" ? "flex-start" : "flex-end",
                      display: "flex",
                    }}
                  >
                    {msg.date} {msg.time}
                  </div>
                </div>
              ))}
            </div>

     
            <div className="d-flex align-items-center">
              <input
                type="text"
                className="form-control me-2 ticket-message-input"
                placeholder="Type your message here..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button className="ticket-send-btn" onClick={handleSendMessage}>
                <FaPaperPlane />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MyTickets;

