import React, { useState, useEffect, useRef } from "react";
import { FaPaperPlane, FaSearch } from "react-icons/fa";
import { ConverIcon, JdIcon, FileIcon, PlusIcon, DiscusIcon, PLusIcon } from "../components/icons";
import { getAccessToken } from "../utils/userUtils";
import { getApiBaseUrl } from "../utils/corsConfig";
import { threadsAPI } from "../utils/apiUtils";
import { useThreadWebSocket } from "../utils/useThreadWebSocket";
import { toast } from "react-toastify";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [chatSubject, setChatSubject] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChatMessages, setActiveChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [superadminId, setSuperadminId] = useState("");
  const [creatingChat, setCreatingChat] = useState(false);
  const [superadmins, setSuperadmins] = useState([]);
  const [loadingSuperadmins, setLoadingSuperadmins] = useState(false);
  const typingTimeoutRef = useRef(null);

  const API_BASE_URL = getApiBaseUrl();

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

  // Fetch superadmins from API
  const fetchSuperadmins = async () => {
    try {
      setLoadingSuperadmins(true);
      const token = getAccessToken();
      const apiUrl = `${API_BASE_URL}/user/superadmins/`;

      console.log('Fetching superadmins from:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch superadmins');
      }

      const data = await response.json();
      console.log('Superadmins API Response:', data);

      if (data.success && data.data && data.data.superadmins) {
        setSuperadmins(data.data.superadmins);
        console.log('✅ Superadmins loaded:', data.data.superadmins.length);
      } else {
        setSuperadmins([]);
      }
    } catch (err) {
      console.error('Error fetching superadmins:', err);
      setSuperadmins([]);
    } finally {
      setLoadingSuperadmins(false);
    }
  };

  // Fetch superadmins when modal opens
  useEffect(() => {
    if (showModal) {
      fetchSuperadmins();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  // Fetch chats from API
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching threads from API...');

        const response = await threadsAPI.getThreads();

        console.log('Threads API Response:', response);

        if (response.success && response.data && response.data.threads) {
          // Transform API data to match component structure
          const transformedChats = response.data.threads.map(thread => {
            // Format the time - use last_message_at if available, otherwise created_at
            let formattedTime = 'N/A';
            if (thread.last_message_at) {
              const date = new Date(thread.last_message_at);
              formattedTime = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
            } else if (thread.created_at) {
              const date = new Date(thread.created_at);
              formattedTime = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
            }

            // Get staff names as a string
            const staffNames = thread.assigned_staff_names && thread.assigned_staff_names.length > 0
              ? thread.assigned_staff_names.join(', ')
              : 'Tax Professional';

            // Get last message preview text
            const lastMessageText = thread.last_message_preview
              ? thread.last_message_preview.content || 'No message'
              : 'No message';

            return {
              id: thread.id,
              name: staffNames,
              lastMessage: lastMessageText,
              time: formattedTime,
              status: thread.status,
              unreadCount: thread.unread_count || 0,
              createdAt: thread.created_at,
              subject: thread.subject,
              // Store additional data
              assignedStaff: thread.assigned_staff,
              assignedStaffNames: thread.assigned_staff_names,
              clientName: thread.client_name,
              firmName: thread.firm_name,
              lastMessagePreview: thread.last_message_preview,
              // Initialize messages array for each chat
              messages: [],
            };
          });

          console.log('Transformed chats:', transformedChats);
          console.log('Number of conversations:', transformedChats.length);

          setConversations(transformedChats);
          console.log('✅ Conversations state set');

          // Set first chat as active if available
          if (transformedChats.length > 0) {
            console.log('Setting active conversation ID:', transformedChats[0].id);
            console.log('First conversation data:', transformedChats[0]);
            setActiveConversationId(transformedChats[0].id);
          }
        } else {
          console.log('No threads in response');
          setConversations([]);
        }
      } catch (err) {
        console.error('Error fetching threads:', err);
        setError(err.message || 'Failed to load chats');
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  ) || null;

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
        console.log('Fetching messages for thread:', activeConversationId);
        const response = await threadsAPI.getThreadDetails(activeConversationId);
        console.log('Thread details response:', response);

        if (response && response.success === true && response.data) {
          const messagesArray = Array.isArray(response.data.messages) ? response.data.messages : [];
          console.log('Messages array length:', messagesArray.length);

          if (messagesArray.length > 0) {
            // Transform messages to match component structure
            const transformedMessages = messagesArray.map(msg => {
              // Determine message type based on sender_role
              let messageType = "user"; // Default for client messages
              if (msg.sender_role === "Admin" || msg.sender_role === "Staff" || msg.sender_role === "Accountant" || msg.sender_role === "Bookkeeper" || msg.sender_role === "Assistant") {
                messageType = "admin";
              }

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
                attachment: msg.attachment || null,
                attachmentName: msg.attachment_name || null,
                attachmentSize: msg.attachment_size_display || null,
              };
            });

            console.log('Transformed messages:', transformedMessages);
            setActiveChatMessages(transformedMessages);

            // Update conversation's last message in the list
            if (transformedMessages.length > 0) {
              const lastMessage = transformedMessages[transformedMessages.length - 1];
              setConversations(prevConvs =>
                prevConvs.map(conv =>
                  conv.id === activeConversationId
                    ? { ...conv, lastMessage: lastMessage.text, messages: transformedMessages }
                    : conv
                )
              );
            }

            // Mark messages as read via WebSocket
            transformedMessages.forEach(msg => {
              if (!msg.isRead && msg.type === "admin") {
                wsMarkAsRead(msg.id);
              }
            });
          } else {
            setActiveChatMessages([]);
          }
        } else {
          setActiveChatMessages([]);
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
        // Determine message type based on sender_role
        let messageType = "user"; // Default for client messages
        if (msg.sender_role === "Admin" || msg.sender_role === "Staff" || msg.sender_role === "Accountant" || msg.sender_role === "Bookkeeper" || msg.sender_role === "Assistant") {
          messageType = "admin";
        }

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

      // Update conversation's last message
      if (transformedMessages.length > 0) {
        const lastMessage = transformedMessages[transformedMessages.length - 1];
        setConversations(prevConvs =>
          prevConvs.map(conv =>
            conv.id === activeConversationId
              ? { ...conv, lastMessage: lastMessage.text }
              : conv
          )
        );
      }

      // Mark new messages as read
      transformedMessages.forEach(msg => {
        if (!msg.isRead && msg.type === "admin") {
          wsMarkAsRead(msg.id);
        }
      });
    }
  }, [wsMessages, activeConversationId, wsMarkAsRead]);


  const handleSend = async () => {
    if (newMessage.trim() === "" || !activeConversationId) return;

    const messageText = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX

    // Stop typing indicator
    wsSendTyping(false);

    try {
      // Try WebSocket first if connected
      if (wsConnected) {
        const sent = wsSendMessage(messageText, false);
        if (sent) {
          console.log('✅ Message sent via WebSocket');
          return;
        }
      }

      // Fallback to REST API
      console.log('Sending message via REST API');
      const response = await threadsAPI.sendMessage(activeConversationId, {
        content: messageText,
        message_type: 'text',
        is_internal: false
      });

      if (response.success) {
        console.log('✅ Message sent successfully via REST API');
        // Message will be added via WebSocket or we can add it manually
        const newMsg = {
          id: response.data?.id || Date.now(),
          type: "user",
          text: messageText,
          date: response.data?.created_at || new Date().toISOString(),
          sender: response.data?.sender_name || 'You',
          senderRole: response.data?.sender_role || '',
          isRead: false,
          isEdited: false,
          messageType: 'text',
        };

        setActiveChatMessages(prev => [...prev, newMsg]);
        setConversations(prevConvs =>
          prevConvs.map(conv =>
            conv.id === activeConversationId
              ? { ...conv, lastMessage: messageText }
              : conv
          )
        );
      } else {
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Restore the message to input on error
      setNewMessage(messageText);
      toast.error('Failed to send message: ' + err.message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        icon: false,
        className: "custom-toast-error",
        bodyClassName: "custom-toast-body",
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
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        wsSendTyping(false);
      }, 2000);
    }
  };


  const handleCreateChat = async () => {
    if (chatSubject.trim() === "") {
      toast.error('Please fill in subject', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        icon: false,
        className: "custom-toast-error",
        bodyClassName: "custom-toast-body",
      });
      return;
    }

    try {
      setCreatingChat(true);

      const payload = {
        subject: chatSubject,
        message: chatMessage.trim() || "Hello, I need assistance with my taxes."
      };

      console.log('Creating thread with payload:', payload);

      const response = await threadsAPI.createThread(payload);
      console.log('Create thread response:', response);

      if (response.success && response.data) {
        const thread = response.data;

        // Format the time
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

        // Get staff names as a string
        const staffNames = thread.assigned_staff_names && thread.assigned_staff_names.length > 0
          ? thread.assigned_staff_names.join(', ')
          : 'Tax Professional';

        // Get last message preview text
        const lastMessageText = thread.last_message_preview
          ? thread.last_message_preview.content || 'No message'
          : 'No message';

        // Transform the created thread to match component structure
        const newChat = {
          id: thread.id,
          name: staffNames,
          lastMessage: lastMessageText,
          time: formattedTime,
          status: thread.status,
          unreadCount: thread.unread_count || 0,
          createdAt: thread.created_at,
          subject: thread.subject,
          // Store additional data
          assignedStaff: thread.assigned_staff,
          assignedStaffNames: thread.assigned_staff_names,
          clientName: thread.client_name,
          firmName: thread.firm_name,
          lastMessagePreview: thread.last_message_preview,
          messages: [],
        };

        // Add the new chat to the beginning of conversations list
        setConversations([newChat, ...conversations]);
        setActiveConversationId(newChat.id);

        // Reset form
        setShowModal(false);
        setChatSubject("");
        setChatMessage("");
        setAttachedFiles([]);

        console.log('✅ Thread created successfully:', newChat);
      } else {
        throw new Error(response.message || 'Failed to create thread');
      }
    } catch (err) {
      console.error('Error creating thread:', err);
      toast.error('Failed to create thread: ' + err.message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        icon: false,
        className: "custom-toast-error",
        bodyClassName: "custom-toast-body",
      });
    } finally {
      setCreatingChat(false);
    }
  };


  const handleFileChange = (e) => {
    setAttachedFiles(Array.from(e.target.files));
  };

  // Debug logging - useEffect to track conversations changes
  useEffect(() => {
    console.log('🔄 Conversations state changed:', {
      conversations: conversations,
      conversationsLength: conversations.length,
      loading: loading,
      error: error,
      activeConversationId: activeConversationId,
      activeConversation: activeConversation
    });

    if (conversations.length > 0) {
      console.log('📝 First conversation details:', conversations[0]);
    }
  }, [conversations, loading, error, activeConversationId, activeConversation]);

  // Component render logging
  console.log('🎨 Messages Component Rendering:', {
    conversations: conversations,
    conversationsLength: conversations.length,
    loading: loading,
    error: error,
    activeConversationId: activeConversationId
  });

  return (
    <div className="px-4">

      <div className="d-flex justify-content-between align-items-center mb-3 px-2">
        <div>
          <h5 className="mb-0" style={{ color: "#3B4A66", fontSize: "26px", fontWeight: "500", fontFamily: "BasisGrotesquePro", }}>Messages</h5>
          <small style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}>Communicate with your tax professional</small>
        </div>
        <button
          className="btn d-flex align-items-center"
          style={{ backgroundColor: "#F56D2D", color: "#FFFFFF", fontFamily: "BasisGrotesquePro" }}
          onClick={() => setShowModal(true)}
        >
          <span className="me-2 text-white" ><PLusIcon /></span>
          New Message
        </button>

      </div>

      <div className="d-flex flex-grow-1 overflow-hidden">

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
          <div className="flex-grow-1 d-flex flex-column mt-3" style={{ gap: "12px", overflowY: "auto", overflowX: "hidden", maxHeight: "calc(55vh - 150px)" }}>
            {/* Loading State */}
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted small">Loading conversations...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-5">
                <p className="text-danger small">{error}</p>
                <button
                  className="btn btn-sm btn-outline-primary mt-2"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && conversations.length === 0 && (
              <div className="text-center py-5">
                <p className="text-muted small mb-0">No conversations yet</p>
                <p className="text-muted small">Start a new message to begin</p>
              </div>
            )}

            {/* Conversations List */}
            {!loading && !error && conversations.length > 0 && (
              <div style={{ width: "100%" }}>
                {console.log('🎯 Rendering conversations list, count:', conversations.length)}
                {conversations.map((conv, index) => {
                  console.log(`📦 Rendering conversation ${index + 1}:`, conv);
                  return (
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
                        console.log('Clicked conversation:', conv.id);
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
                      {conv.task && (
                        <div className="mt-2 d-flex align-items-center gap-1" style={{ marginLeft: "35px", fontSize: "12px" }}>
                          <span style={{ color: "#3B4A66", fontSize: "12px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Task:</span>
                          <span className="px-2 py-1 rounded-pill text-dark small" style={{ backgroundColor: "#fff", border: "1px solid #ddd" }}>
                            {conv.task.current}/{conv.task.total}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-grow-1 bg-white rounded shadow-sm p-3 d-flex flex-column" style={{ height: "55vh", minHeight: "400px" }}>
          {activeConversation ? (
            <>
              <div className="border-bottom pb-2 mb-3 d-flex align-items-center gap-2" style={{ flexShrink: 0 }}>
                <ConverIcon className="text-primary" size={20} />
                <div>
                  <h6 className="mb-0" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>{activeConversation.name}</h6>
                  <small style={{ color: "#3B4A66", fontSize: "12px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
                    {activeConversation.status === 'active' ? 'Active' : 'Closed'}
                  </small>
                </div>
              </div>

              <div className="flex-grow-1 mb-3" style={{ overflowY: "auto", overflowX: "hidden", minHeight: "200px" }}>
                {console.log('Rendering messages, count:', activeChatMessages.length, 'messages:', activeChatMessages, 'loading:', loadingMessages)}
                {loadingMessages ? (
                  <div className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                    <p className="text-muted mt-2 small">Loading messages...</p>
                  </div>
                ) : activeChatMessages.length > 0 ? (
                  activeChatMessages.map((msg) => {
                    // Admin/Staff messages appear on left
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
                    // User/Client messages appear on right
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
                  })
                ) : (
                  <div className="text-center py-5">
                    <p className="text-muted">No messages yet. Start the conversation!</p>
                  </div>
                )}
              </div>

              <div className="border-top pt-2" style={{ flexShrink: 0 }}>
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
                  <button className="btn" style={{ background: "#F56D2D", color: "#fff" }} onClick={handleSend} disabled={!wsConnected && wsError}>
                    <FaPaperPlane />
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
          )}
        </div>
      </div>

      {/* Popup Modal */}
      {showModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="bg-white p-4" style={{ width: "500px", border: "1px solid #E8F0FF", borderRadius: "16px" }}>
            <h5 className="mb-3" style={{ color: "#3B4A66", fontSize: "24px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Create a new chat</h5>
            <div className="mb-3">
              <label className="form-label" style={{ color: "#131323", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Chat Subject</label>
              <input type="text" className="form-control" placeholder="Subject" value={chatSubject}
                onChange={(e) => setChatSubject(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ color: "#131323", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Message</label>
              <textarea className="form-control" rows="3" placeholder="Write your message here.. " style={{ fontFamily: "BasisGrotesquePro" }}
                value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} />
            </div>
            <div className="mb-3 ms-1">
              <label
                className="form-label small d-flex align-items-center"
                style={{ cursor: "pointer", gap: "8px" }}
              >
                <PlusIcon />
                <span style={{ fontFamily: "BasisGrotesquePro", color: "#131323" }}>Attach Document</span>
                <input
                  type="file"
                  multiple
                  className="d-none"
                  onChange={handleFileChange}
                />
              </label>

              {attachedFiles.length > 0 && (
                <ul className="mt-2  ms-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                  {attachedFiles.map((file, idx) => (
                    <li key={idx}>{file.name}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="text-end">
              <button
                className="btn btn-outline-secondary me-2"
                onClick={() => setShowModal(false)}
                disabled={creatingChat}
              >
                Cancel
              </button>
              <button
                className="btn"
                style={{ background: "#F56D2D", color: "#fff", fontFamily: "BasisGrotesquePro" }}
                onClick={handleCreateChat}
                disabled={creatingChat || !chatSubject.trim()}
              >
                {creatingChat ? 'Creating...' : 'Create Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






