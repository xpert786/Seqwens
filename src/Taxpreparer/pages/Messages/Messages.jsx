import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { AddTask, Cliented, Clocking, Completed, Message3Icon, Overdue, Progressing, Stared, LogoIcond, Linked, Crossing, Sendingg, DeleteIcon, Cut2 } from "../../component/icons";
import { FaSearch, FaChevronDown, FaPaperPlane } from "react-icons/fa";
import { ConverIcon, JdIcon, FileIcon, PlusIcon, PLusIcon } from "../../../ClientOnboarding/components/icons";
import taxheaderlogo from "../../../assets/logo.png";
import { taxPreparerThreadsAPI } from "../../../ClientOnboarding/utils/apiUtils";
import { useThreadWebSocket } from "../../../ClientOnboarding/utils/useThreadWebSocket";
import { toast } from "react-toastify";

export default function MessagePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(location.search);
  const clientIdFromUrl = urlParams.get('clientId');
  const threadIdFromUrl = urlParams.get('threadId');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All Messages");
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("Messages");
  const [showOptions, setShowOptions] = useState(false);
  const [conversations, setConversations] = useState([]);
  const threadsFetchInitialRef = useRef(true);
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
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const isSendButtonActive = newMessage.trim().length > 0;
  const sendButtonStyles = {
    background: isSendButtonActive ? "#F56D2D" : "#E5E7EB",
    color: isSendButtonActive ? "#fff" : "#9CA3AF",
    cursor: isSendButtonActive ? "pointer" : "not-allowed"
  };

  // WebSocket hook for real-time messaging
  const {
    isConnected: wsConnected,
    messages: wsMessages,
    typingUsers,
    error: wsError,
    sendMessage: wsSendMessage,
    sendTyping: wsSendTyping,
    markAsRead: wsMarkAsRead,
    markAllAsRead: wsMarkAllAsRead,
  } = useThreadWebSocket(activeConversationId, true);

  const filterOptions = [
    "All Messages",
    "Unread",
    "Read",
    "Internal",
    "Archived"
  ];

  const fetchThreads = useCallback(
    async (isPolling = false) => {
      try {
        if (threadsFetchInitialRef.current && !isPolling) {
          setLoadingThreads(true);
          threadsFetchInitialRef.current = false;
        }
        setThreadsError(null);

        const response = await taxPreparerThreadsAPI.getThreads();

        if (response.success && response.data && response.data.threads) {
          const transformedThreads = response.data.threads.map(thread => {
            const lastTimestamp =
              thread.last_message_at ||
              thread.updated_at ||
              thread.created_at ||
              new Date().toISOString();

            let formattedTime = "N/A";
            if (lastTimestamp) {
              const date = new Date(lastTimestamp);
              const now = new Date();
              const diffMs = now - date;
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

              if (diffHours < 1) {
                formattedTime = "Just now";
              } else if (diffHours < 24) {
                formattedTime = `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
              } else if (diffDays < 7) {
                formattedTime = `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
              } else {
                formattedTime = date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }
            } else if (thread.created_at) {
              const date = new Date(thread.created_at);
              formattedTime = date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }

            const clientName = thread.client_name || "Unknown Client";
            const lastMessageText = thread.last_message_preview
              ? thread.last_message_preview.content || "No message"
              : "No message";
            const truncatedMessage =
              lastMessageText.length > 50 ? lastMessageText.substring(0, 50) + "..." : lastMessageText;

            return {
              id: thread.id,
              name: clientName,
              lastMessage: truncatedMessage,
              time: formattedTime,
              lastMessageAt: lastTimestamp,
              status: thread.status,
              unreadCount: thread.unread_count || 0,
              createdAt: thread.created_at,
              subject: thread.subject,
              assignedStaff: thread.assigned_staff,
              assignedStaffNames: thread.assigned_staff_names,
              clientName: thread.client_name,
              clientEmail: thread.client_email,
              clientId: thread.client || thread.client_id || null,
              firmName: thread.firm_name,
              lastMessagePreview: thread.last_message_preview,
              messages: [],
            };
          });

          const sortedThreads = transformedThreads.sort((a, b) => {
            const dateA = new Date(a.lastMessageAt || 0);
            const dateB = new Date(b.lastMessageAt || 0);
            return dateB - dateA;
          });

          setConversations(sortedThreads);

          if (clientIdFromUrl || threadIdFromUrl) {
            let targetThread = null;

            if (threadIdFromUrl) {
              targetThread = sortedThreads.find(
                conv => conv.id.toString() === threadIdFromUrl.toString()
              );
            } else if (clientIdFromUrl) {
              targetThread = sortedThreads.find(conv => {
                if (conv.clientId && conv.clientId.toString() === clientIdFromUrl.toString()) {
                  return true;
                }
                return false;
              });
            }

            if (targetThread) {
              setActiveConversationId(targetThread.id);
              navigate(location.pathname, { replace: true });
            } else if (sortedThreads.length > 0 && !activeConversationId) {
              setActiveConversationId(sortedThreads[0].id);
            }
          } else if (sortedThreads.length > 0 && !activeConversationId) {
            setActiveConversationId(sortedThreads[0].id);
          }
        } else {
          setConversations([]);
        }
      } catch (err) {
        console.error("Error fetching threads:", err);
        if (!isPolling) {
          setThreadsError(err.message || "Failed to load conversations");
        }
      } finally {
        if (!isPolling) {
          setLoadingThreads(false);
        }
      }
    },
    [clientIdFromUrl, threadIdFromUrl, activeConversationId, navigate, location.pathname]
  );

  // Fetch messages for active conversation (initial load and periodic polling)
  const fetchMessages = useCallback(
    async (isPolling = false) => {
      if (!activeConversationId) {
        setActiveChatMessages([]);
        setLoadingMessages(false);
        return;
      }

      try {
        if (!isPolling) {
          setLoadingMessages(true);
        }

        const response = await taxPreparerThreadsAPI.getThreadDetails(activeConversationId);

        if (response && response.success === true && response.data) {
          const messagesArray = Array.isArray(response.data.messages) ? response.data.messages : [];

          if (messagesArray.length > 0) {
            const transformedMessages = messagesArray.map(msg => {
              const isClient = msg.sender_role === "Client" || msg.sender_role === "client";
              const messageType = isClient ? "admin" : "user";

              return {
                id: msg.id,
                type: messageType,
                text: msg.content || "",
                date: msg.created_at,
                sender: msg.sender_name || "",
                senderRole: msg.sender_role || "",
                isRead: msg.is_read || false,
                isEdited: msg.is_edited || false,
                messageType: msg.message_type || "text",
                isInternal: msg.is_internal || false,
                attachment: msg.attachment || null,
                attachmentName: msg.attachment_name || null,
                attachmentSize: msg.attachment_size_display || null,
              };
            });

            setActiveChatMessages(prev => {
              const prevIds = new Set(prev.map(m => m.id));
              const newIds = new Set(transformedMessages.map(m => m.id));

              if (
                prevIds.size === newIds.size &&
                [...prevIds].every(id => newIds.has(id)) &&
                [...newIds].every(id => prevIds.has(id))
              ) {
                return prev;
              }

              return transformedMessages;
            });

            transformedMessages.forEach(msg => {
              if (!msg.isRead && msg.type === "admin") {
                wsMarkAsRead(msg.id);
              }
            });

            setTimeout(() => {
              if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
              }
            }, 100);
          } else {
            setActiveChatMessages([]);
          }
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        if (!isPolling) {
          setLoadingMessages(false);
        }
      }
    },
    [activeConversationId, wsMarkAsRead]
  );

  useEffect(() => {
    fetchMessages(false);
    const intervalId = setInterval(() => {
      if (activeConversationId) {
        fetchMessages(true);
      }
    }, 5000);
    return () => clearInterval(intervalId);
  }, [activeConversationId, fetchMessages]);

  // Sync WebSocket messages with local state - INSTANT display
  useEffect(() => {
    if (wsMessages && wsMessages.length > 0 && activeConversationId) {
      // Filter messages that belong to the active conversation
      // WebSocket is already connected to the specific thread, but double-check
      const relevantMessages = wsMessages.filter(msg => {
        // Check if message has thread_id and it matches active conversation
        return !msg.thread_id || msg.thread_id === activeConversationId;
      });

      if (relevantMessages.length > 0) {
        const transformedMessages = relevantMessages.map(msg => {
          // Tax preparer's sent messages appear on RIGHT, client's received messages appear on LEFT
          const isClient = msg.sender_role === "Client" || msg.sender_role === "client";
          let messageType = isClient ? "admin" : "user";

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

        // Merge with existing messages, avoiding duplicates - INSTANT UPDATE
        setActiveChatMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMessages = transformedMessages.filter(m => !existingIds.has(m.id));

          if (newMessages.length > 0) {
            // Remove optimistic messages that match the new real messages (by text and approximate time)
            const filtered = prev.filter(prevMsg => {
              if (prevMsg.isOptimistic) {
                // Check if this optimistic message matches any new message
                return !newMessages.some(newMsg => 
                  newMsg.text === prevMsg.text && 
                  Math.abs(new Date(newMsg.date) - new Date(prevMsg.date)) < 5000 // Within 5 seconds
                );
              }
              return true;
            });
            
            const merged = [...filtered, ...newMessages].sort((a, b) => {
              return new Date(a.date) - new Date(b.date);
            });
            return merged;
          }
          return prev;
        });

        // Update conversation's last message in conversations list - INSTANT
        if (transformedMessages.length > 0 && activeConversationId) {
          const lastMessage = transformedMessages[transformedMessages.length - 1];
          const truncatedMessage = lastMessage.text.length > 50
            ? lastMessage.text.substring(0, 50) + '...'
            : lastMessage.text;

        setConversations(prevConvs => {
          const updated = prevConvs.map(conv => {
            if (conv.id === activeConversationId) {
              return {
                ...conv,
                lastMessage: truncatedMessage,
                time: 'Just now',
                lastMessageAt: lastMessage.date || new Date().toISOString(),
                unreadCount:
                  lastMessage.type === "admin" && !lastMessage.isRead
                    ? (conv.unreadCount || 0) + 1
                    : conv.unreadCount || 0,
              };
            }
            return conv;
          });
          return updated.sort((a, b) => {
            const dateA = new Date(a.lastMessageAt || 0);
            const dateB = new Date(b.lastMessageAt || 0);
            return dateB - dateA;
          });
        });
        fetchThreads(true);
        }

        // Mark client messages as read (client messages are type "admin" now, appearing on left)
        transformedMessages.forEach(msg => {
          if (!msg.isRead && msg.type === "admin") {
            wsMarkAsRead(msg.id);
          }
        });

        // Auto-scroll to bottom for new messages - INSTANT
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 50);
      }
    }
  }, [wsMessages, activeConversationId, wsMarkAsRead]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
      if (isNearBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [activeChatMessages]);

  const handleSend = async () => {
    if (newMessage.trim() === "" || !activeConversationId) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    // Stop typing indicator
    wsSendTyping(false);

    try {
      // Determine message type: Tax preparer's sent messages go to RIGHT
      const messageType = "user"; // Tax preparer sends → "user" (right side)

      // Optimistic update - add message instantly to chat area
      const optimisticMsg = {
        id: `temp-${Date.now()}`,
        type: messageType,
        text: messageText,
        date: new Date().toISOString(),
        sender: 'You',
        senderRole: '',
        isRead: false,
        isEdited: false,
        messageType: 'text',
        isOptimistic: true, // Mark as optimistic
      };

      // Add message instantly to chat area
      setActiveChatMessages(prev => [...prev, optimisticMsg].sort((a, b) => new Date(a.date) - new Date(b.date)));
      
      // Update conversation list instantly
      const truncatedMessage = messageText.length > 50
        ? messageText.substring(0, 50) + '...'
        : messageText;

      setConversations(prevConvs => {
        const updated = prevConvs.map(conv => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              lastMessage: truncatedMessage,
              time: 'Just now',
              lastMessageAt: new Date().toISOString(),
            };
          }
          return conv;
        });
        return updated.sort((a, b) => {
          const dateA = new Date(a.lastMessageAt || 0);
          const dateB = new Date(b.lastMessageAt || 0);
          return dateB - dateA;
        });
      });

      // Auto-scroll to bottom instantly
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 50);

      // Try WebSocket first if connected
      if (wsConnected) {
        const sent = wsSendMessage(messageText, false); // false = not internal
        if (sent) {
          console.log('✅ Message sent via WebSocket');
          // Message will come back via WebSocket and replace optimistic message
          return;
        }
      }

      // Fallback to REST API
      const response = await taxPreparerThreadsAPI.sendMessage(activeConversationId, {
        content: messageText,
        message_type: 'text',
        is_internal: false
      });

      if (response.success) {
        // Replace optimistic message with real message
        const senderRole = response.data?.sender_role || '';
        const isClient = senderRole === "Client" || senderRole === "client";
        const finalMessageType = isClient ? "admin" : "user";

        const realMsg = {
          id: response.data?.id || Date.now(),
          type: finalMessageType,
          text: messageText,
          date: response.data?.created_at || new Date().toISOString(),
          sender: response.data?.sender_name || 'You',
          senderRole: senderRole,
          isRead: false,
          isEdited: false,
          messageType: 'text',
        };

        setActiveChatMessages(prev => {
          // Remove optimistic message and add real one
          const filtered = prev.filter(m => m.id !== optimisticMsg.id);
          const exists = filtered.some(m => m.id === realMsg.id);
          if (exists) return filtered;
          return [...filtered, realMsg].sort((a, b) => new Date(a.date) - new Date(b.date));
        });

        // Update conversation's last message in conversations list
        const truncatedMessage = messageText.length > 50
          ? messageText.substring(0, 50) + '...'
          : messageText;

        setConversations(prevConvs => {
          const updated = prevConvs.map(conv => {
            if (conv.id === activeConversationId) {
              return {
                ...conv,
                lastMessage: truncatedMessage,
                time: 'Just now',
                lastMessageAt: realMsg.date || new Date().toISOString(),
              };
            }
            return conv;
          });
          return updated.sort((a, b) => {
            const dateA = new Date(a.lastMessageAt || 0);
            const dateB = new Date(b.lastMessageAt || 0);
            return dateB - dateA;
          });
        });
        fetchThreads(true);
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

  // Fetch threads from API (initial load and periodic polling)

  useEffect(() => {
    fetchThreads(false);
    const intervalId = setInterval(() => {
      fetchThreads(true);
    }, 10000);
    return () => clearInterval(intervalId);
  }, [fetchThreads]);

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

  return (
    <div className="px-4">
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
      <div className="d-flex justify-content-between align-items-center mb-3 px-2">
        <div>
          <h5 className="mb-0" style={{ color: "#3B4A66", fontSize: "26px", fontWeight: "500", fontFamily: "BasisGrotesquePro", }}>Messages</h5>
          <small style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}>Communicate with clients and team members</small>
        </div>
        <button
          className="btn d-flex align-items-center"
          style={{ backgroundColor: "#F56D2D", color: "#FFFFFF", fontFamily: "BasisGrotesquePro" }}
          onClick={() => setShowComposeModal(true)}
        >
          <span className="me-2 text-white"><PLusIcon /></span>
          New Message
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="d-flex flex-grow-1 overflow-hidden">

        {/* Left Column - Conversations */}
        <div className="p-3 me-3 d-flex flex-column" style={{ width: "500px", height: "55vh", border: "1px solid #E8F0FF", backgroundColor: "#FFFFFF", borderRadius: "12px", minHeight: "400px" }}>
          <div className="mb-2">
            <h5 className="mb-3" style={{ color: "#3B4A66", fontSize: "16px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Conversations</h5>

            <div style={{ position: "relative", width: "100%" }}>
              <FaSearch
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#6c757d",
                }}
              />
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                style={{
                  fontFamily: "BasisGrotesquePro",
                  paddingLeft: "35px",
                }}
              />
            </div>
          </div>
          <div className="flex-grow-1 overflow-auto d-flex flex-column mt-3" style={{ gap: "12px" }}>
            {/* Loading State */}
            {loadingThreads && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted small">Loading conversations...</p>
              </div>
            )}

            {/* Error State */}
            {threadsError && !loadingThreads && (
              <div className="text-center py-5">
                <p className="text-danger small">{threadsError}</p>
                <button
                  className="btn btn-sm btn-outline-primary mt-2"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loadingThreads && !threadsError && conversations.length === 0 && (
              <div className="text-center py-5">
                <p className="text-muted small mb-0">No conversations yet</p>
                <p className="text-muted small">Start a new message to begin</p>
              </div>
            )}

            {/* Conversations List */}
            {!loadingThreads && !threadsError && conversations.length > 0 && (
              <div style={{ width: "100%" }}>
                {conversations.map((conv, index) => (
                  <div
                    key={conv.id || `conv-${index}`}
                    className="conversation-item p-3"
                    style={{
                      cursor: "pointer",
                      border: "2px solid #E8F0FF",
                      backgroundColor: conv.id === activeConversationId ? "#E8F0FF" : "#F3F7FF",
                      borderRadius: "12px",
                      fontFamily: "BasisGrotesquePro",
                      color: "#3B4A66",
                      marginBottom: index < conversations.length - 1 ? "12px" : "0",
                      width: "100%",
                      minHeight: "80px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center"
                    }}
                    onClick={() => {
                      setActiveConversationId(conv.id);
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="d-flex align-items-center">
                        <ConverIcon className="me-2 text-primary" />
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>{conv.name}</div>
                          {conv.unreadCount > 0 && (
                            <span className="badge bg-danger" style={{ fontSize: "10px" }}>
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <small style={{ color: "#3B4A66", fontSize: "12px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>{conv.time}</small>
                    </div>
                    <small style={{ marginLeft: "35px", color: "#4B5563", fontSize: "12px" }}>{conv.lastMessage || 'No message'}</small>
                    {conv.subject && (
                      <div className="mt-1 d-flex align-items-center gap-1" style={{ marginLeft: "35px", fontSize: "11px" }}>
                        <span style={{ color: "#F56D2D", fontSize: "11px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Subject:</span>
                        <span style={{ color: "#3B4A66", fontSize: "11px", fontFamily: "BasisGrotesquePro" }}>{conv.subject}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Chat Interface */}
        <div className="flex-grow-1 bg-white rounded shadow-sm p-3 d-flex flex-column">
          {/* Chat Header with Tabs */}
          {(() => {
            const activeConversation = conversations.find(c => c.id === activeConversationId);
            return activeConversation ? (
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <div className="d-flex align-items-center gap-2">
                  <ConverIcon className="text-primary" size={20} />
                  <div>
                    <h6 className="mb-0" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>{activeConversation.name}</h6>
                    <small style={{ color: "#3B4A66", fontSize: "12px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
                      {activeConversation.status === 'active' ? 'Active' : 'Closed'}
                    </small>
                  </div>
                </div>
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
                      cursor: "pointer",
                      fontFamily: "BasisGrotesquePro"
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
                      cursor: "pointer",
                      fontFamily: "BasisGrotesquePro"
                    }}
                  >
                    Tasks
                  </button>
                </div>
              </div>
            ) : (
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <div>
                  <h6 className="mb-0" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Select a conversation</h6>
                  <small style={{ color: "#3B4A66", fontSize: "12px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
                    Choose a conversation to view messages
                  </small>
                </div>
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
                      cursor: "pointer",
                      fontFamily: "BasisGrotesquePro"
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
                      cursor: "pointer",
                      fontFamily: "BasisGrotesquePro"
                    }}
                  >
                    Tasks
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Chat Content and Input Area */}
          {activeTab === "Tasks" ? (
            /* Tasks Tab Content - Keep existing Tasks tab content */
            <>
              <div className="flex-grow-1 overflow-auto mb-3 d-flex align-items-center justify-content-center" style={{ minHeight: "200px" }}>
                <div className="text-center">
                  <p className="text-muted">Tasks functionality coming soon</p>
                </div>
              </div>
              <div className="border-top pt-2">
                <div className="d-flex align-items-center">
                  <input
                    type="text"
                    className="form-control me-2"
                    placeholder="Write a message..."
                    value={newMessage}
                    onChange={handleTyping}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    style={{ fontFamily: "BasisGrotesquePro" }}
                  />
                  <button
                    type="button"
                    className="btn"
                    style={sendButtonStyles}
                    onClick={handleSend}
                    aria-label="Send message"
                    disabled={!isSendButtonActive}
                  >
                    <FaPaperPlane
                      onClick={handleSend}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: "pointer" }}
                    />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Messages Tab Content */
            <>
              {(() => {
                const activeConversation = conversations.find(c => c.id === activeConversationId);
                return activeConversation ? (
                  <>
                    <div 
                      ref={messagesContainerRef}
                      className="flex-grow-1 overflow-auto mb-3" 
                      style={{ 
                        minHeight: "200px",
                        maxHeight: "calc(55vh - 200px)",
                        scrollbarWidth: "thin",
                        scrollbarColor: "#C1C1C1 #F3F7FF"
                      }}
                    >
                      <style>
                        {`
                          .flex-grow-1.overflow-auto.mb-3::-webkit-scrollbar {
                            width: 8px;
                          }
                          .flex-grow-1.overflow-auto.mb-3::-webkit-scrollbar-track {
                            background: #F3F7FF;
                            border-radius: 10px;
                          }
                          .flex-grow-1.overflow-auto.mb-3::-webkit-scrollbar-thumb {
                            background: #C1C1C1;
                            border-radius: 10px;
                          }
                          .flex-grow-1.overflow-auto.mb-3::-webkit-scrollbar-thumb:hover {
                            background: #A0A0A0;
                          }
                        `}
                      </style>
                      {loadingMessages ? (
                        <div className="text-center py-5">
                          <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                          <p className="text-muted mt-2 small">Loading messages...</p>
                        </div>
                      ) : activeChatMessages.length > 0 ? (
                        <>
                        {activeChatMessages.map((msg) => {
                          // Client messages (received) appear on LEFT
                          if (msg.type === "admin") {
                            return (
                              <div key={msg.id} className="d-flex mb-3" style={{ fontFamily: "BasisGrotesquePro" }}>
                                <JdIcon color="#f97316" className="me-2" />
                                <div className="bg-light p-2 px-3 rounded" style={{ marginLeft: "10px", fontFamily: "BasisGrotesquePro", maxWidth: "70%" }}>
                                  <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "4px", fontWeight: "500" }}>
                                    {msg.sender}
                                  </div>
                                  <div>{msg.text}</div>
                                  {msg.attachment && (
                                    <div className="mt-2">
                                      <FileIcon className="me-2 text-primary" />
                                      <a href={msg.attachment} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#3B82F6" }}>
                                        {msg.attachmentName || "Attachment"}
                                      </a>
                                      {msg.attachmentSize && (
                                        <span style={{ fontSize: "11px", color: "#9CA3AF", marginLeft: "8px" }}>
                                          ({msg.attachmentSize})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>
                                    {new Date(msg.date).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                    {msg.isEdited && (
                                      <span style={{ marginLeft: "8px", fontStyle: "italic" }}>(edited)</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          // Tax preparer messages (sent) appear on RIGHT
                          else if (msg.type === "user") {
                            return (
                              <div key={msg.id} className="d-flex mb-3 justify-content-end">
                                <div className="bg-light p-2 px-3 rounded" style={{ fontFamily: "BasisGrotesquePro", marginRight: "10px", maxWidth: "70%", backgroundColor: "#E8F0FF" }}>
                                  <div>{msg.text}</div>
                                  {msg.attachment && (
                                    <div className="mt-2">
                                      <FileIcon className="me-2 text-primary" />
                                      <a href={msg.attachment} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#3B82F6" }}>
                                        {msg.attachmentName || "Attachment"}
                                      </a>
                                      {msg.attachmentSize && (
                                        <span style={{ fontSize: "11px", color: "#9CA3AF", marginLeft: "8px" }}>
                                          ({msg.attachmentSize})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px", textAlign: "right" }}>
                                    {new Date(msg.date).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                    {msg.isEdited && (
                                      <span style={{ marginLeft: "8px", fontStyle: "italic" }}>(edited)</span>
                                    )}
                                  </div>
                                </div>
                                <JdIcon color="#f97316" className="ms-2" />
                              </div>
                            );
                          }
                          return null;
                        })}
                        <div ref={messagesEndRef} />
                        </>
                      ) : (
                        <div className="text-center py-5">
                          <p className="text-muted">No messages yet. Start the conversation!</p>
                        </div>
                      )}
                    </div>

                    <div className="border-top pt-2">
                      <div className="d-flex align-items-center">
                        {/* WebSocket connection indicator */}
                        {wsConnected && (
                          <div className="me-2" style={{ fontSize: "10px", color: "#10B981" }} title="Connected">
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10B981" }}></div>
                          </div>
                        )}
                        {!wsConnected && wsError && (
                          <div className="me-2" style={{ fontSize: "10px", color: "#EF4444" }} title="Disconnected">
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#EF4444" }}></div>
                          </div>
                        )}
                        {/* Typing indicator */}
                        {typingUsers.length > 0 && (
                          <div className="me-2" style={{ fontSize: "12px", color: "#6B7280", fontStyle: "italic" }}>
                            {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                          </div>
                        )}
                        <input
                          type="text"
                          className="form-control me-2"
                          placeholder="Write a message..."
                          value={newMessage}
                          onChange={handleTyping}
                          onKeyDown={(e) => e.key === "Enter" && handleSend()}
                          style={{ fontFamily: "BasisGrotesquePro" }}
                        />
                        <button
                          type="button"
                          className="btn"
                          style={sendButtonStyles}
                          onClick={handleSend}
                          disabled={!isSendButtonActive}
                          aria-label="Send message"
                        >
                          <FaPaperPlane
                            onClick={handleSend}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleSend();
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            style={{ cursor: "pointer" }}
                          />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <div className="text-center">
                      <p className="text-muted mb-0">Select a conversation to view messages</p>
                    </div>
                  </div>
                );
              })()}
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
                onClick={async () => {
                  try {
                    if (!composeForm.subject || !composeForm.message) {
                      toast.error('Please fill in subject and message', {
                        position: "top-right",
                        autoClose: 3000,
                      });
                      return;
                    }

                    // Extract client_id from recipients (assuming format like "client:26" or just the ID)
                    // For now, we'll need to get client_id from the selected recipient
                    // This is a placeholder - you may need to adjust based on your recipient selection logic
                    const clientId = composeForm.recipients.length > 0
                      ? parseInt(composeForm.recipients[0].replace('client:', ''))
                      : null;

                    if (!clientId) {
                      toast.error('Please select a client recipient', {
                        position: "top-right",
                        autoClose: 3000,
                      });
                      return;
                    }

                    // Extract assigned_staff_ids from recipients (staff members)
                    const assignedStaffIds = composeForm.recipients
                      .filter(r => r.startsWith('@') || r.includes('staff'))
                      .map(r => {
                        // Extract ID from recipient string
                        const match = r.match(/\d+/);
                        return match ? parseInt(match[0]) : null;
                      })
                      .filter(id => id !== null);

                    const payload = {
                      client_id: clientId,
                      subject: composeForm.subject,
                      assigned_staff_ids: assignedStaffIds.length > 0 ? assignedStaffIds : [],
                      message: composeForm.message
                    };

                    console.log('Creating thread with payload:', payload);

                    const response = await taxPreparerThreadsAPI.createThread(payload);

                    if (response.success && response.data) {
                      const thread = response.data;

                      // Format the time
                      let formattedTime = 'Just now';

                      // Get client name
                      const clientName = thread.client_name || 'Unknown Client';

                      // Get last message preview text
                      const lastMessageText = thread.last_message_preview
                        ? (thread.last_message_preview.content || composeForm.message || 'No message')
                        : (composeForm.message || 'No message');

                      // Truncate message if too long
                      const truncatedMessage = lastMessageText.length > 50
                        ? lastMessageText.substring(0, 50) + '...'
                        : lastMessageText;

                      // Transform the created thread to match component structure
                      const threadTimestamp = thread.last_message_at || thread.created_at || new Date().toISOString();
                      const newThread = {
                        id: thread.id,
                        name: clientName,
                        lastMessage: truncatedMessage,
                        time: formattedTime,
                        status: thread.status,
                        unreadCount: thread.unread_count || 0,
                        createdAt: threadTimestamp,
                        lastMessageAt: threadTimestamp,
                        subject: thread.subject,
                        assignedStaff: thread.assigned_staff,
                        assignedStaffNames: thread.assigned_staff_names,
                        clientName: thread.client_name,
                        clientEmail: thread.client_email,
                        firmName: thread.firm_name,
                        lastMessagePreview: thread.last_message_preview,
                        messages: [],
                      };

                      // Add the new thread to the beginning of conversations list
                      setConversations(prev =>
                        [newThread, ...prev].sort((a, b) => {
                          const dateA = new Date(a.lastMessageAt || 0);
                          const dateB = new Date(b.lastMessageAt || 0);
                          return dateB - dateA;
                        })
                      );
                      setActiveConversationId(newThread.id);

                      toast.success('Thread created successfully', {
                        position: "top-right",
                        autoClose: 3000,
                      });

                      setShowComposeModal(false);
                      // Reset form
                      setComposeForm({
                        recipients: [],
                        subject: "",
                        category: "Client",
                        priority: "Medium",
                        message: ""
                      });
                    } else {
                      throw new Error(response.message || 'Failed to create thread');
                    }
                  } catch (err) {
                    console.error('Error creating thread:', err);
                    toast.error('Failed to create thread: ' + err.message, {
                      position: "top-right",
                      autoClose: 3000,
                    });
                  }
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

