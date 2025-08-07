import { useState } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { CrossIcon, ConversIcon } from "../icons"

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
      date: now.toLocaleDateString("en-GB"), // DD/MM/YYYY format
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    newTickets[openPopupTicket].messages.push(newMessage);
    setTickets(newTickets);
    setMessageInput("");
  };



  const getStatusBadge = (status) => {
    if (status === "Open") {
      return (
        <span
          className="badge fw-normal ms-3"
          style={{
            backgroundColor: "#FEF9C3",
            color: "#854D0E",
            border: "1px solid #854D0E",
            fontSize: "11px",
            borderRadius: "12px",
          }}
        >
          {status}
        </span>
      );
    } else if (status === "Resolved") {
      return (
        <span
          className="badge fw-normal ms-3"
          style={{
            backgroundColor: "#DCFCE7",
            color: "#166534",
            border: "1px solid #166534",
            fontSize: "11px",
            borderRadius: "12px",
          }}
        >
          {status}
        </span>
      );
    }
  };

  const getPriorityBadge = (priority) => {
    if (priority === "Medium") {
      return (
        <span
          className="badge fw-normal ms-2"
          style={{
            backgroundColor: "#FBBF24",
            color: "#3B4A66",
            fontSize: "11px",
            fontFamily: "BasisGrotesquePro",
            borderRadius: "12px",
          }}
        >
          {priority}
        </span>
      );
    } else if (priority === "Low") {
      return (
        <span
          className="badge fw-normal ms-2"
          style={{
            backgroundColor: "#EF4444",
            color: "#3B4A66",
            fontSize: "11px",
            fontFamily: "BasisGrotesquePro",
            borderRadius: "12px",
          }}
        >
          {priority}
        </span>
      );
    }
  };

  return (
    <div>
      <div className="align-items-center mb-3">
        <h5
          className="mb-0 me-3"
          style={{
            fontFamily: "BasisGrotesquePro",
            color: "#3B4A66",
            fontSize: "19px",
            fontWeight: "500",
          }}
        >
          My Support Tickets
        </h5>
        <p
          className="mb-0"
          style={{ fontSize: "13px", color: "#4B5563", fontWeight: "400" }}
        >
          Track your support requests
        </p>
      </div>

      {tickets.map((ticket, index) => (
        <div
          key={index}
          onClick={() => setSelectedTicketBox(index)}
          className="p-3 mb-3 rounded-4 d-flex justify-content-between align-items-start"
          style={{
            cursor: "pointer",
            backgroundColor:
              selectedTicketBox === index ? "#FFF4E6" : "#FFFFFF",
            border: `1px solid ${selectedTicketBox === index ? "#F49C2D" : "#E8F0FF"
              }`,
          }}
        >
          <div>
            <div className="mb-2 d-flex align-items-center">
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "#3B4A66",
                  fontFamily: "BasisGrotesquePro",
                }}
              >
                {ticket.id}
              </span>
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>

            <div
              className="mb-1"
              style={{
                fontSize: "12px",
                color: "#4B5563",
                fontWeight: "400",
                fontFamily: "BasisGrotesquePro",
              }}
            >
              {ticket.title}
            </div>
            <div
              className="text-muted"
              style={{
                fontSize: "12px",
                color: "#4B5563",
                fontWeight: "500",
                fontFamily: "BasisGrotesquePro",
              }}
            >
              Created: {ticket.created} &nbsp;&nbsp;|&nbsp;&nbsp; Last update:{" "}
              {ticket.updated}
            </div>
          </div>
          <button
            className="btn btn-light btn-sm px-3"
            style={{
              border: "1px solid #E8F0FF",
              fontSize: "15px",
              fontWeight: "400",
              backgroundColor: "#FFFFFF",
              fontFamily: "BasisGrotesquePro",
              borderRadius: "8px",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setOpenPopupTicket(index);
            }}
          >
            View Details
          </button>
        </div>
      ))}




      {openPopupTicket !== null && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="rounded-4 p-4"
            style={{
              width: "750px",
              backgroundColor: "#FFFFFF",
              border :"1px solid #E8F0FF",
              
            }}
          >
            {/* Header */}
            <div>
              <div className="d-flex justify-content-between align-items-center">
                <h6
                  style={{
                    fontFamily: "BasisGrotesquePro",
                    fontSize: "22px",
                     fontFamily: "BasisGrotesquePro",
                    color: "#3B4A66",
                    fontWeight: "500",
                    margin: "0",
                    lineHeight: "1.2",
                  }}
                >
                  Ticket Details - {tickets[openPopupTicket].id}
                </h6>
                <button
                  onClick={closePopup}
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: "20px",
                    cursor: "pointer",
                    margin: "0",
                  }}
                >
                  <CrossIcon />
                </button>
              </div>

              <p
                style={{
                  fontSize: "14px",
                  fontWeight:"400",
                  color: "#4B5563",
                  margin: "0",
                  paddingTop: "2px",
                  lineHeight: "1.2",
                  fontFamily: "BasisGrotesquePro"
                }}
              >
                View and respond to your support ticket
              </p>
            </div>


            {/* Issue Box */}
            <div
              className="p-3 rounded-3 mb-3"
              style={{
                border: "1px solid #E8F0FF",
                backgroundColor: "#FFFFFF",
                marginTop: "20px"
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center">
                  <strong style={{ fontSize: "14px", color: "#3B4A66", fontWeight:"500",  fontFamily: "BasisGrotesquePro" }}>
                    {tickets[openPopupTicket].title}
                  </strong>
                  <div className="d-flex align-items-center" style={{ marginLeft: "300px",  fontFamily: "BasisGrotesquePro" }}>
                    {getStatusBadge(tickets[openPopupTicket].status)}
                    {getPriorityBadge(tickets[openPopupTicket].priority)}
                  </div>
                </div>
              </div>

              <p
                style={{
                  fontSize: "13px",
                  color: "#4B5563",
                  margin: "6px 0",
                  fontWeight:"400",
                  color:"#4B5563",
                  fontFamily: "BasisGrotesquePro"
                }}
              >
                {tickets[openPopupTicket].description}
              </p>

              <div
                className="d-flex justify-content-between"
                style={{ fontSize: "12px", color: "#4B5563", marginTop: "8px" }}
              >
                <div>
                  <div style={{ fontWeight: "400", fontSize: "11px", fontFamily: "BasisGrotesquePro",color:"#4B5563" }}>Category:</div>
                  <div style={{color: "#3B4A66", fontWeight:"600", fontSize:"11px", fontFamily: "BasisGrotesquePro"  }}>
                    {tickets[openPopupTicket].category}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: "400", fontSize: "11px", fontFamily: "BasisGrotesquePro",color:"#4B5563" }}>Created:</div>
                  <div style={{color: "#3B4A66", fontWeight:"600", fontSize:"11px", fontFamily: "BasisGrotesquePro"  }}>
                    {tickets[openPopupTicket].created}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: "400", fontSize: "11px", fontFamily: "BasisGrotesquePro",color:"#4B5563" }}>Last Update:</div>
                  <div style={{color: "#3B4A66", fontWeight:"600", fontSize:"11px", fontFamily: "BasisGrotesquePro"  }}>
                    {tickets[openPopupTicket].updated}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: "400", fontSize: "11px", fontFamily: "BasisGrotesquePro",color:"#4B5563" }}>Messages:</div>
                  <div style={{color: "#3B4A66", fontWeight:"600", fontSize:"11px", fontFamily: "BasisGrotesquePro"  }}>
                    {tickets[openPopupTicket].messages.length}
                  </div>
                </div>
              </div>


            </div>

            {/* Quick Actions */}
            <div className="mb-3">
              <span style={{ fontSize: "14px", fontWeight: "400", color:"#4B5563", fontFamily: "BasisGrotesquePro" }}>
                Quick Actions:
              </span>
              <button className="btn" style={{ fontSize: "14px", fontWeight: "400", color:"#3B4A66", fontFamily: "BasisGrotesquePro", backgroundColor:"#FFFFFF", border:"1px solid #E8F0FF", marginLeft:"20px"  }}>
                Mark as Resolved
              </button>
              <button className="btn ms-3" style={{ fontSize: "14px", fontWeight: "400", color:"#FFFFFF", fontFamily: "BasisGrotesquePro", backgroundColor:"#F56D2D"}}>Close Ticket</button>
            </div>

            <h6 style={{ fontSize: "15px", fontWeight: "500", color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}>
              Conversation
            </h6>
            <div
              className="border rounded-3 p-3 mb-3"
              style={{
                maxHeight: "280px",
                overflowY: "auto",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8F0FF"
              }}
            >
              {tickets[openPopupTicket].messages.map((msg, idx) => (
                <div key={idx} className="mb-4">
                  <div
                    className={`d-flex ${msg.role === "agent" ? "justify-content-start" : "justify-content-end"}`}
                  >
                    {/* Agent Side Icon */}
                    {msg.role === "agent" && (
                      <div className="me-2">
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: "#F56D2D",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: "16px",
                          }}
                        >
                          <ConversIcon style={{ width: "18px", height: "18px", color: "#fff" }} />
                        </div>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className="p-3 rounded-3"
                      style={{
                        backgroundColor: msg.role === "agent" ? "#FFF4E6" : "#F3F7FF",
                        maxWidth: "48%",
                        fontSize: "13px",
                        border: msg.role === "agent" ? "1px solid #F49C2D" : "1px solid #E8F0FF",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          whiteSpace: "pre-wrap",
                          color: "#3B4A66",
                          fontSize:"12px",
                          fontWeight:"400",
                          fontFamily: "BasisGrotesquePro"

                        }}
                      >
                        {msg.text}
                      </p>
                    </div>

                    {/* User Side Icon */}
                    {msg.role === "user" && (
                      <div className="ms-2">
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: "#F56D2D",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: "16px",
                          }}
                        >
                          <ConversIcon style={{ width: "18px", height: "18px", color: "#fff" }} />
                        </div>
                      </div>
                    )}
                  </div>


                  {/* Date & Time under each message */}
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#4B5563",
                      marginTop: "4px",
                      fontWeight:"400",
                       fontFamily: "BasisGrotesquePro",
                      display: "flex",
                      justifyContent: msg.role === "agent" ? "flex-start" : "flex-end",
                      paddingLeft: msg.role === "agent" ? "40px" : "0",
                      paddingRight: msg.role === "user" ? "40px" : "0",
                    }}
                  >
                    {msg.date} {msg.time}
                  </div>
                </div>
              ))}


            </div>

            {/* Message Input */}
            <div className="d-flex align-items-center">
              <input
                type="text"
                className="form-control me-2"
                placeholder="Type your message here..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                style={{
                  borderRadius: "12px",
                  fontSize: "13px",
                  padding: "10px",
                  fontFamily: "BasisGrotesquePro"
                  
                }}
              />
              <button
                className="btn d-flex align-items-center justify-content-center"
                onClick={handleSendMessage}
                style={{
                  backgroundColor: "#F97316",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                }}
              >
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

