import React, { useState, useRef, useEffect } from "react";
import { AddTask, Cliented, Clocking, Completed, Message3Icon, Overdue, Progressing, Stared, LogoIcond, Linked, Crossing, Sendingg, DeleteIcon, Cut2 } from "../../component/icons";
import { FaSearch, FaChevronDown, FaPaperPlane } from "react-icons/fa";
import taxheaderlogo from "../../../assets/logo.png";
import { threadsAPI } from "../../../ClientOnboarding/utils/apiUtils";
import { useThreadWebSocket } from "../../../ClientOnboarding/utils/useThreadWebSocket";
import { toast } from "react-toastify";

export default function MessagePage() {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All Messages");
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("Messages");
  const [showOptions, setShowOptions] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [showTaskPopup, setShowTaskPopup] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [threadsError, setThreadsError] = useState(null);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeForm, setComposeForm] = useState({
    recipients: ["@everyone", "@smithjohnson", "@everyone"],
    subject: "",
    category: "Client",
    priority: "Medium",
    message: ""
  });
  const [tasks, setTasks] = useState([
    { id: 1, text: "Review all sections carefully", completed: true },
    { id: 2, text: "Check personal information", completed: true },
    { id: 3, text: "", completed: false, isInput: true }
  ]);
  const [newTaskText, setNewTaskText] = useState("");
  const [activeChatMessages, setActiveChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const typingTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  // WebSocket hook for real-time messaging
  const {
    isConnected: wsConnected,
    messages: wsMessages,
    typingUsers,
    error: wsError,
    sendMessage: wsSendMessage,
    sendTyping: wsSendTyping,
    markAsRead: wsMarkAsRead,
  } = useThreadWebSocket(activeConversationId, true);

  const filterOptions = [
    "All Messages",
    "Unread",
    "Read",
    "Internal",
    "Archived"
  ];

  // Fetch messages for active conversation (initial load)
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversationId) {
        setActiveChatMessages([]);
        setLoadingMessages(false);
        return;
      }

      try {
        setLoadingMessages(true);
        const response = await threadsAPI.getThreadDetails(activeConversationId);

        if (response && response.success === true && response.data) {
          const messagesArray = Array.isArray(response.data.messages) ? response.data.messages : [];

          if (messagesArray.length > 0) {
            const transformedMessages = messagesArray.map(msg => {
              // Staff messages appear on left, client messages on right
              let messageType = msg.sender_role === "Client" ? "user" : "admin";

              return {
                id: msg.id,
                type: messageType,
                text: msg.content || '',
                date: msg.created_at,
                sender: msg.sender_name || '',
                senderRole: msg.sender_role || '',
                isRead: msg.is_read || false,
                isEdited: msg.is_edited || false,
                messageType: msg.message_type || 'text',
                isInternal: msg.is_internal || false,
                attachment: msg.attachment || null,
                attachmentName: msg.attachment_name || null,
                attachmentSize: msg.attachment_size_display || null,
              };
            });

            setActiveChatMessages(transformedMessages);

            // Mark messages as read via WebSocket
            transformedMessages.forEach(msg => {
              if (!msg.isRead && msg.type === "user") {
                wsMarkAsRead(msg.id);
              }
            });
          } else {
            setActiveChatMessages([]);
          }
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        setActiveChatMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeConversationId, wsMarkAsRead]);

  // Sync WebSocket messages with local state
  useEffect(() => {
    if (wsMessages && wsMessages.length > 0) {
      const transformedMessages = wsMessages.map(msg => {
        let messageType = msg.sender_role === "Client" ? "user" : "admin";

        return {
          id: msg.id,
          type: messageType,
          text: msg.content || '',
          date: msg.created_at,
          sender: msg.sender_name || '',
          senderRole: msg.sender_role || '',
          isRead: msg.is_read || false,
          isEdited: msg.is_edited || false,
          messageType: msg.message_type || 'text',
          isInternal: msg.is_internal || false,
          attachment: msg.attachment || null,
          attachmentName: msg.attachment_name || null,
          attachmentSize: msg.attachment_size_display || null,
        };
      });

      // Merge with existing messages, avoiding duplicates
      setActiveChatMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMessages = transformedMessages.filter(m => !existingIds.has(m.id));
        const merged = [...prev, ...newMessages].sort((a, b) => {
          return new Date(a.date) - new Date(b.date);
        });
        return merged;
      });

      // Mark new messages as read
      transformedMessages.forEach(msg => {
        if (!msg.isRead && msg.type === "user") {
          wsMarkAsRead(msg.id);
        }
      });
    }
  }, [wsMessages, wsMarkAsRead]);

  const handleSend = async () => {
    if (newMessage.trim() === "" || !activeConversationId) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    // Stop typing indicator
    wsSendTyping(false);

    try {
      // Try WebSocket first if connected
      if (wsConnected) {
        const sent = wsSendMessage(messageText, false); // false = not internal
        if (sent) {
          console.log('✅ Message sent via WebSocket');
          return;
        }
      }

      // Fallback to REST API
      const response = await threadsAPI.sendMessage(activeConversationId, {
        content: messageText,
        message_type: 'text',
        is_internal: false
      });

      if (response.success) {
        const newMsg = {
          id: response.data?.id || Date.now(),
          type: "admin",
          text: messageText,
          date: response.data?.created_at || new Date().toISOString(),
          sender: response.data?.sender_name || 'You',
          senderRole: response.data?.sender_role || '',
          isRead: false,
          isEdited: false,
          messageType: 'text',
        };

        setActiveChatMessages(prev => [...prev, newMsg]);
      } else {
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setNewMessage(messageText);
      toast.error('Failed to send message: ' + err.message, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Handle typing indicator
  const handleTyping = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Send typing indicator via WebSocket
    if (wsConnected && value.trim().length > 0) {
      wsSendTyping(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        wsSendTyping(false);
      }, 2000);
    }
  };

  const handleTaskToggle = (taskId) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, completed: !task.completed }
        : task
    ));
  };

  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleAddTask = () => {
    if (newTaskText.trim()) {
      const newTask = {
        id: Date.now(),
        text: newTaskText,
        completed: false,
        isInput: false
      };
      setTasks([...tasks.filter(task => !task.isInput), newTask, { id: Date.now() + 1, text: "", completed: false, isInput: true }]);
      setNewTaskText("");
    }
  };

  const handleTaskInputChange = (value) => {
    setNewTaskText(value);
  };

  // Fetch threads from API
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoadingThreads(true);
        setThreadsError(null);

        console.log('Fetching threads from API...');

        const response = await threadsAPI.getThreads();

        console.log('Threads API Response:', response);

        if (response.success && response.data && response.data.threads) {
          // Transform API data to match component structure
          const transformedThreads = response.data.threads.map(thread => {
            // Format the time - use last_message_at if available, otherwise created_at
            let formattedTime = 'N/A';
            if (thread.last_message_at) {
              const date = new Date(thread.last_message_at);
              const now = new Date();
              const diffMs = now - date;
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

              if (diffHours < 1) {
                formattedTime = 'Just now';
              } else if (diffHours < 24) {
                formattedTime = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
              } else if (diffDays < 7) {
                formattedTime = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
              } else {
                formattedTime = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                });
              }
            } else if (thread.created_at) {
              const date = new Date(thread.created_at);
              formattedTime = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              });
            }

            // Get client name
            const clientName = thread.client_name || 'Unknown Client';

            // Get last message preview text
            const lastMessageText = thread.last_message_preview
              ? (thread.last_message_preview.content || 'No message')
              : 'No message';

            // Truncate message if too long
            const truncatedMessage = lastMessageText.length > 50
              ? lastMessageText.substring(0, 50) + '...'
              : lastMessageText;

            return {
              id: thread.id,
              name: clientName,
              lastMessage: truncatedMessage,
              time: formattedTime,
              status: thread.status,
              unreadCount: thread.unread_count || 0,
              createdAt: thread.created_at,
              subject: thread.subject,
              // Store additional data
              assignedStaff: thread.assigned_staff,
              assignedStaffNames: thread.assigned_staff_names,
              clientName: thread.client_name,
              clientEmail: thread.client_email,
              firmName: thread.firm_name,
              lastMessagePreview: thread.last_message_preview,
              // Initialize messages array for each chat
              messages: [],
            };
          });

          console.log('Transformed threads:', transformedThreads);

          setConversations(transformedThreads);

          // Set first thread as active if available
          if (transformedThreads.length > 0 && !activeConversationId) {
            setActiveConversationId(transformedThreads[0].id);
          }
        } else {
          console.log('No threads in response');
          setConversations([]);
        }
      } catch (err) {
        console.error('Error fetching threads:', err);
        setThreadsError(err.message || 'Failed to load conversations');
      } finally {
        setLoadingThreads(false);
      }
    };

    fetchThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const stats = [
    {
      label: "Total",
      count: 8,
      icon: <Message3Icon />,
      color: "#4F46E5"
    },
    {
      label: "Unread",
      count: 3,
      icon: <Clocking />,
      color: "#F59E0B"
    },
    {
      label: "Client",
      count: 4,
      icon: <Cliented />,
      color: "#3B82F6"
    },
    {
      label: "Internal",
      count: 1,
      icon: <Completed />,
      color: "#10B981"
    },
    {
      label: "Starred",
      count: 0,
      icon: <Stared />,
      color: "#EF4444"
    },
  ];

  return (
    <div className="p-4">
      <style>
        {`
          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-semibold" style={{ marginBottom: 4 }}>Messages</h3>
          <small className="text-muted">Communicate with clients and team members</small>
        </div>
        <button
          onClick={() => setShowComposeModal(true)}
          className="btn dashboard-btn btn-upload d-flex align-items-center gap-2"
        >
          <AddTask />
          New Messages
        </button>
      </div>


      {/* Stat cards row (Bootstrap grid) */}
      <div className="row g-3 mb-4">
        {stats.map((s, i) => (
          <div key={i} className="col-12 col-sm-6 col-md-4 col-lg">
            <div className="card h-100" style={{
              borderRadius: 16,
              border: "1px solid #E8F0FF",
              minHeight: '120px'
            }}>
              <div className="card-body d-flex flex-column p-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="stat-icon" style={{
                    color: "#00C0C6",
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '10px',
                    flexShrink: 0
                  }}>
                    {s.icon}
                  </div>
                  <div className="stat-count ms-3" style={{
                    color: "#3B4A66",
                    fontWeight: 600,
                    fontSize: '24px',
                    textAlign: 'right',
                    flexGrow: 1
                  }}>
                    {s.count}
                  </div>
                </div>
                <div className="mt-auto">
                  <p className="mb-0 text-muted fw-semibold">{s.label}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div style={{ display: "flex", gap: "24px", marginTop: "24px" }}>

        {/* Left Column - Conversations */}
        <div
          className="card"
          style={{
            borderRadius: "12px",
            border: "none",
            backgroundColor: "#fff",
            padding: "20px",
            flex: "0 0 300px",
            height: "390px"
          }}
        >
          {/* Conversations Title */}
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#2D3748",
              marginBottom: "16px",
              textAlign: "left"
            }}
          >
            Conversations
          </h2>

          {/* Search Bar */}
          <div
            className="position-relative mb-4"
            style={{ marginBottom: "16px" }}
          >
            <FaSearch
              style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#718096",
                fontSize: "16px"
              }}
            />
            <input
              type="text"
              placeholder="Search..."
              style={{
                width: "100%",
                padding: "12px 16px 12px 48px",
                border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                borderRadius: "8px",
                fontSize: "16px",
                backgroundColor: "#fff",
                outline: "none",
                transition: "border-color 0.2s ease"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#4A90E2";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--Palette2-Dark-blue-100, #E8F0FF)";
              }}
            />
          </div>

          {/* Conversations List */}
          {loadingThreads ? (
            <div style={{ textAlign: "center", padding: "20px", color: "#718096" }}>
              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
              <p style={{ marginTop: "10px", fontSize: "14px" }}>Loading conversations...</p>
            </div>
          ) : threadsError ? (
            <div style={{ textAlign: "center", padding: "20px", color: "#EF4444" }}>
              <p style={{ fontSize: "14px" }}>{threadsError}</p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: "10px",
                  padding: "8px 16px",
                  backgroundColor: "#F56D2D",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                Retry
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px", color: "#718096" }}>
              <p style={{ fontSize: "14px", marginBottom: "8px" }}>No conversations yet</p>
              <p style={{ fontSize: "12px", color: "#A0AEC0" }}>Start a new message to begin</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "330px", overflowY: "auto" }}>
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  style={{
                    backgroundColor: activeConversationId === conv.id ? "#FFEDCC" : "#FFF5E6",
                    borderRadius: "12px",
                    padding: "16px",
                    border: activeConversationId === conv.id ? "2px solid #F56D2D" : "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (activeConversationId !== conv.id) {
                      e.currentTarget.style.backgroundColor = "#FFEDCC";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeConversationId !== conv.id) {
                      e.currentTarget.style.backgroundColor = "#FFF5E6";
                    }
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    {/* Avatar with Logo */}
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        overflow: "hidden"
                      }}
                    >
                      <img
                        src={taxheaderlogo}
                        alt="User Avatar"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "50%"
                        }}
                      />
                    </div>

                    {/* Message Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <h3
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#2D3748",
                              margin: 0,
                              lineHeight: "1.4"
                            }}
                          >
                            {conv.name}
                          </h3>
                          {conv.unreadCount > 0 && (
                            <span
                              style={{
                                backgroundColor: "#EF4444",
                                color: "white",
                                borderRadius: "50%",
                                width: "18px",
                                height: "18px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "10px",
                                fontWeight: "600"
                              }}
                            >
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#A0AEC0",
                            fontWeight: "400"
                          }}
                        >
                          {conv.time}
                        </span>
                      </div>

                      {conv.subject && (
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#718096",
                            margin: "0 0 4px 0",
                            fontWeight: "500"
                          }}
                        >
                          {conv.subject}
                        </p>
                      )}

                      <p
                        style={{
                          fontSize: "12px",
                          color: "#718096",
                          margin: 0,
                          lineHeight: "1.4"
                        }}
                      >
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Chat Interface */}
        <div
          className="card"
          style={{
            borderRadius: "12px",
            border: "none",
            backgroundColor: "#fff",
            flex: "1",
            display: "flex",
            flexDirection: "column",
            height: "600px"
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid #F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            {/* User Info */}
            {(() => {
              const activeConversation = conversations.find(c => c.id === activeConversationId);
              return activeConversation ? (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      overflow: "hidden"
                    }}
                  >
                    <img
                      src={taxheaderlogo}
                      alt="User Avatar"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "50%"
                      }}
                    />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#2D3748", margin: 0 }}>
                      {activeConversation.name}
                    </h3>
                    <p style={{ fontSize: "14px", color: "#718096", margin: 0 }}>
                      {activeConversation.subject || "No subject"}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#2D3748", margin: 0 }}>
                    Select a conversation
                  </h3>
                  <p style={{ fontSize: "14px", color: "#718096", margin: 0 }}>
                    Choose a conversation to view messages
                  </p>
                </div>
              );
            })()}

            {/* Tabs */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setActiveTab("Messages")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: activeTab === "Messages" ? "#00C0C6" : "white",
                  color: activeTab === "Messages" ? "white" : "#718096",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer"
                }}
              >
                Messages
              </button>
              <button
                onClick={() => setActiveTab("Tasks")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: activeTab === "Tasks" ? "#00C0C6" : "white",
                  color: activeTab === "Tasks" ? "white" : "#718096",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer"
                }}
              >
                Tasks
              </button>
            </div>
          </div>

          {/* Chat Content and Input Area */}
          {activeTab === "Tasks" ? (
            /* Tasks Tab Content */
            <>
              {/* Task Content Area */}
              <div
                style={{
                  flex: "1",
                  backgroundColor: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  padding: "20px"
                }}
              >
                <div style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "flex-start",
                  paddingTop: "40px"
                }}>
                  {/* Task Card */}
                  <div style={{
                    position: "relative",
                    maxWidth: "350px"
                  }}>
                    {/* Task Card */}
                    <div style={{
                      backgroundColor: "#F7F9FC",
                      borderRadius: "12px",
                      padding: "20px",
                      border: "1px solid #E2E8F0",
                      marginBottom: "10px",
                      marginRight: "35px"
                    }}>
                      {/* Task Title */}
                      <h3 style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#2D3748",
                        margin: "0 0 8px 0",
                        lineHeight: "1.4"
                      }}>
                        Review Tax Return Draft
                      </h3>

                      {/* Task Description */}
                      <p style={{
                        fontSize: "14px",
                        color: "#718096",
                        margin: "0 0 16px 0",
                        lineHeight: "1.5"
                      }}>
                        Please review your 2023 tax return draft and approve or request changes
                      </p>

                      {/* Task Checklist */}
                      <div style={{ marginBottom: "16px" }}>
                        {[
                          "Review all sections carefully",
                          "Check personal information",
                          "Verify income amounts"
                        ].map((item, index) => (
                          <div key={index} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "8px"
                          }}>
                            <div style={{
                              width: "16px",
                              height: "16px",
                              border: "2px solid #CBD5E0",
                              borderRadius: "50%",
                              flexShrink: 0
                            }}></div>
                            <span style={{
                              fontSize: "14px",
                              color: "#4A5568",
                              lineHeight: "1.4"
                            }}>
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>


                    </div>

                    {/* User Avatar */}
                    <div style={{
                      position: "absolute",
                      right: "-10px",
                      top: "10px",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      overflow: "hidden"
                    }}>
                      <img
                        src={taxheaderlogo}
                        alt="User Avatar"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "50%"
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Input Section for Tasks Tab */}
              <div style={{
                padding: "20px 24px",
                backgroundColor: "white"
              }}>
                {/* Message Input */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {/* Message Input with Crossing Icon inside */}
                  <div style={{ flex: "1", position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Write your messages here..."
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      style={{
                        width: "100%",
                        padding: "12px 50px 12px 50px",
                        border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                        borderRadius: "8px",
                        fontSize: "16px",
                        backgroundColor: "#fff",
                        outline: "none",
                        fontFamily: "BasisGrotesquePro"
                      }}
                    />
                    {/* Crossing Icon - Inside input field, left side */}
                    <button
                      onClick={() => {
                        setShowOptions(!showOptions);
                      }}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "24px",
                        height: "24px",
                        borderRadius: "30%",
                        border: "none",
                        backgroundColor: "#F56D2D",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      <Crossing style={{ color: "white", fontSize: "12px" }} />
                    </button>

                    {/* Sendingg Icon - Inside input field, right side */}
                    <button
                      onClick={handleSend}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "24px",
                        height: "24px",
                        borderRadius: "30%",
                        border: "none",
                        backgroundColor: "#F56D2D",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      <Sendingg style={{ color: "white", fontSize: "12px" }} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Messages Tab Content */
            <>
              {/* Chat Content Area */}
              <div
                style={{
                  flex: "1",
                  backgroundColor: showTaskPopup ? "#00000099" : "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  padding: "20px"
                }}
              >
                {/* Empty space - messages would appear here */}
                {!showTaskPopup && (
                  <div style={{
                    color: "#9CA3AF",
                    fontSize: "16px",
                    opacity: 0.7
                  }}>
                    Select a conversation to start messaging
                  </div>
                )}

                {/* Create New Task Popup - positioned in bottom left */}
                {showTaskPopup && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "0px",
                      left: "20px",
                      backgroundColor: "white",
                      borderRadius: "12px",
                      padding: "24px",
                      width: "400px",
                      maxWidth: "90%",
                      zIndex: 100,
                      border: "1px solid #E2E8F0",
                      animation: "slideUp 0.3s ease-out",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)"
                    }}
                  >
                    {/* Header */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "20px"
                    }}>
                      <h3 style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#2D3748",
                        margin: 0
                      }}>
                        Create New Task
                      </h3>
                      <button
                        onClick={() => setShowTaskPopup(false)}
                      >
                        <Cut2 />
                      </button>
                    </div>

                    {/* Task List */}
                    <div style={{ marginBottom: "16px" }}>
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "12px",
                            padding: "8px 0"
                          }}
                        >
                          {/* Checkbox */}
                          <div
                            onClick={() => !task.isInput && handleTaskToggle(task.id)}
                            style={{
                              width: "20px",
                              height: "20px",
                              border: task.completed ? "none" : "2px solid #E2E8F0",
                              borderRadius: "4px",
                              backgroundColor: task.completed ? "#00C0C6" : "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: task.isInput ? "default" : "pointer",
                              flexShrink: 0
                            }}
                          >
                            {task.completed && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path
                                  d="M10 3L4.5 8.5L2 6"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>

                          {/* Task Text or Input */}
                          {task.isInput ? (
                            <input
                              type="text"
                              placeholder="Enter task title"
                              value={newTaskText}
                              onChange={(e) => handleTaskInputChange(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleAddTask();
                                }
                              }}
                              style={{
                                flex: 1,
                                border: "none",
                                outline: "none",
                                fontSize: "14px",
                                color: "#374151",
                                backgroundColor: "transparent",
                                fontFamily: "inherit"
                              }}
                            />
                          ) : (
                            <span style={{
                              flex: 1,
                              fontSize: "14px",
                              color: task.completed ? "#9CA3AF" : "#374151",
                              textDecoration: task.completed ? "line-through" : "none"
                            }}>
                              {task.text}
                            </span>
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteTask(task.id)}

                          >
                            <DeleteIcon style={{ color: "#EF4444" }} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add New Task Button */}
                    <div
                      onClick={handleAddTask}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        padding: "8px 0",
                        color: "#F59E0B"
                      }}
                    >
                      <span style={{ fontSize: "16px", fontWeight: "bold", color: "#F56D2D" }}>+</span>
                      <span style={{ fontSize: "14px", color: "#F56D2D" }}>Enter task title</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Input Section */}
              <div style={{
                padding: "20px 24px",
                backgroundColor: showTaskPopup ? "#00000099" : "white"
              }}>
                {/* Show Add Task / Attach Files only when Messages tab is active and showOptions is true */}
                {showOptions && !showTaskPopup && (
                  <div
                    style={{
                      border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                      borderRadius: "8px",
                      padding: "12px",
                      marginBottom: "16px",
                      backgroundColor: "white",
                      display: "inline-block"
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: "pointer",
                          padding: "8px",
                          borderRadius: "6px",
                          transition: "background-color 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--Palette2-Gold-200, #FFF4E6)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <span style={{ color: "#3B82F6", fontSize: "20px" }}><Linked /></span>
                        <span
                          style={{ fontSize: "14px", color: "#374151", fontWeight: "400", cursor: "pointer" }}
                          onClick={() => setShowTaskPopup(true)}
                        >
                          Add Task
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: "pointer",
                          padding: "8px",
                          borderRadius: "6px",
                          transition: "background-color 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--Palette2-Gold-200, #FFF4E6)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <span style={{ color: "#3B82F6", fontSize: "16px" }}><Linked /></span>
                        <span style={{ fontSize: "14px", color: "#374151", fontWeight: "400" }}>Attach Files</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>

                {/* Message Input */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {/* Message Input with Crossing Icon inside */}
                  <div style={{ flex: "1", position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Write your messages here..."
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      style={{
                        width: "100%",
                        padding: "12px 50px 12px 50px",
                        border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                        borderRadius: "8px",
                        fontSize: "16px",
                        backgroundColor: "#fff",
                        outline: "none",
                        fontFamily: "BasisGrotesquePro"
                      }}
                    />
                    {/* Crossing Icon - Inside input field, left side */}
                    <button
                      onClick={() => {
                        setShowOptions(!showOptions);
                      }}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "24px",
                        height: "24px",
                        borderRadius: "30%",
                        border: "none",
                        backgroundColor: "#F56D2D",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      <Crossing style={{ color: "white", fontSize: "12px" }} />
                    </button>

                    {/* Sendingg Icon - Inside input field, right side */}
                    <button
                      onClick={handleSend}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "24px",
                        height: "24px",
                        borderRadius: "30%",
                        border: "none",
                        backgroundColor: "#F56D2D",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      <Sendingg style={{ color: "white", fontSize: "12px" }} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Compose Message Modal */}
      {showComposeModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#00000099",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,

        }}
          onClick={() => setShowComposeModal(false)}
        >
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "40px",
            width: "95%",
            maxWidth: "700px",
            maxHeight: "85vh",
            overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            position: "relative"
          }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "32px"
            }}>
              <div>
                <h2 style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#1A202C",
                  margin: "0 0 8px 0",
                  lineHeight: "1.2"
                }}>
                  Compose Message
                </h2>
                <p style={{
                  fontSize: "16px",
                  color: "#718096",
                  margin: 0,
                  lineHeight: "1.4"
                }}>
                  Send a new message to a client or team member.
                </p>
              </div>
              <button
                onClick={() => setShowComposeModal(false)}
                style={{
                  background: "#F7F9FC",
                  border: "none",
                  fontSize: "18px",
                  color: "#718096",
                  cursor: "pointer",
                  padding: "12px",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#E2E8F0";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#F7F9FC";
                }}
              >
                ×
              </button>
            </div>

            {/* Form Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Enter Recipients */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#2D3748",
                  marginBottom: "12px"
                }}>
                  Enter Recipients
                </label>
                <div style={{
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  padding: "16px",
                  minHeight: "60px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  alignItems: "center",
                  backgroundColor: "#FAFAFA"
                }}>
                  {composeForm.recipients.map((recipient, index) => (
                    <div key={index} style={{
                      backgroundColor: "#E3F2FD",
                      color: "#1976D2",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontWeight: "500"
                    }}>
                      {recipient}
                      <button
                        onClick={() => {
                          const newRecipients = composeForm.recipients.filter((_, i) => i !== index);
                          setComposeForm({ ...composeForm, recipients: newRecipients });
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#1976D2",
                          cursor: "pointer",
                          fontSize: "14px",
                          padding: 0,
                          width: "18px",
                          height: "18px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          backgroundColor: "rgba(25, 118, 210, 0.1)"
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button style={{
                    backgroundColor: "#F56D2D",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold"
                  }}>
                    @
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#2D3748",
                  marginBottom: "12px"
                }}>
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Enter message subject"
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "16px",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    fontSize: "16px",
                    outline: "none",
                    backgroundColor: "#FAFAFA"
                  }}
                />
              </div>

              {/* Category & Priority */}
              <div style={{ display: "flex", gap: "20px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#2D3748",
                    marginBottom: "12px"
                  }}>
                    Category
                  </label>
                  <select
                    value={composeForm.category}
                    onChange={(e) => setComposeForm({ ...composeForm, category: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "16px",
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      fontSize: "16px",
                      outline: "none",
                      backgroundColor: "#FAFAFA",
                      cursor: "pointer"
                    }}
                  >
                    <option value="Client">Client</option>
                    <option value="Internal">Internal</option>
                    <option value="Team">Team</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#2D3748",
                    marginBottom: "12px"
                  }}>
                    Priority
                  </label>
                  <select
                    value={composeForm.priority}
                    onChange={(e) => setComposeForm({ ...composeForm, priority: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "16px",
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      fontSize: "16px",
                      outline: "none",
                      backgroundColor: "#FAFAFA",
                      cursor: "pointer"
                    }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#2D3748",
                  marginBottom: "12px"
                }}>
                  Message
                </label>
                <textarea
                  placeholder="Enter your message"
                  value={composeForm.message}
                  onChange={(e) => setComposeForm({ ...composeForm, message: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "16px",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    fontSize: "16px",
                    outline: "none",
                    minHeight: "140px",
                    resize: "vertical",
                    backgroundColor: "#FAFAFA",
                    fontFamily: "inherit"
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "16px",
              marginTop: "40px"
            }}>
              <button
                onClick={() => setShowComposeModal(false)}
                style={{
                  padding: "16px 32px",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  backgroundColor: "white",
                  color: "#718096",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#F7F9FC";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "white";
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle send message logic here
                  console.log("Sending message:", composeForm);
                  setShowComposeModal(false);
                }}
                style={{
                  padding: "16px 32px",
                  border: "none",
                  borderRadius: "12px",
                  backgroundColor: "#F56D2D",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#E55A1A";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#F56D2D";
                }}
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

