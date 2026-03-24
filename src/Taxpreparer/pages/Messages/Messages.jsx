import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { AddTask, Cliented, Clocking, Completed, Message3Icon, Overdue, Progressing, Stared, LogoIcond, Linked, Crossing, Sendingg, DeleteIcon, Cut2 } from "../../component/icons";
import { FaSearch, FaPaperPlane, FaLink } from "react-icons/fa";
import { ConverIcon, JdIcon, FileIcon, PlusIcon, PLusIcon } from "../../../ClientOnboarding/components/icons";
import taxheaderlogo from "../../../assets/logo.png";
import { taxPreparerThreadsAPI } from "../../../ClientOnboarding/utils/apiUtils";
import { useThreadWebSocket } from "../../../ClientOnboarding/utils/useThreadWebSocket";
import { chatService } from "../../../ClientOnboarding/utils/chatService";
import { useChatWebSocket } from "../../../ClientOnboarding/utils/useChatWebSocket";
import { getUserData } from "../../../ClientOnboarding/utils/userUtils";
import { toast } from "react-toastify";
import "../../styles/message.css";
export default function MessagePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(location.search);
  const clientIdFromUrl = urlParams.get('clientId');
  const threadIdFromUrl = urlParams.get('threadId');
  const sanitizedClientIdFromUrl = clientIdFromUrl ? clientIdFromUrl.toString() : "";

  const buildComposeForm = (prefilledClientId = null) => {
    const resolvedClientId = prefilledClientId !== null && prefilledClientId !== undefined && prefilledClientId !== ''
      ? prefilledClientId
      : sanitizedClientIdFromUrl;

    return {
      clientId: resolvedClientId ? resolvedClientId.toString() : "",
      subject: "",
      category: "Client",
      priority: "Medium",
      message: "",
      assignedStaffText: "",
    };
  };

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
  const [composeForm, setComposeForm] = useState(() => buildComposeForm());
  const [availableClients, setAvailableClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState(null);
  const clientsFetchedRef = useRef(false);
  const [tasks, setTasks] = useState([
    { id: 1, text: "Review all sections carefully", completed: true },
    { id: 2, text: "Check personal information", completed: true },
    { id: 3, text: "", completed: false, isInput: true }
  ]);
  const [newTaskText, setNewTaskText] = useState("");
  const [activeChatMessages, setActiveChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageAttachment, setMessageAttachment] = useState(null);
  const messageFileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const filterOptions = ["All", "Active", "Closed"];
  const dropdownRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth >= 992) {
        setShowChatOnMobile(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isSendButtonActive = newMessage.trim().length > 0;
  const sendButtonStyles = {
    background: isSendButtonActive ? "#F56D2D" : "#E5E7EB",
    color: isSendButtonActive ? "#fff" : "#9CA3AF",
    cursor: isSendButtonActive ? "pointer" : "not-allowed"
  };

  // WebSocket hook for real-time messaging (using new chat-threads API)
  const {
    isConnected: wsConnected,
    messages: wsMessages,
    typingUsers,
    error: wsError,
    sendMessage: wsSendMessage,
    sendTyping: wsSendTyping,
    markAsRead: wsMarkAsRead,
    markAllAsRead: wsMarkAllAsRead,
  } = useChatWebSocket(activeConversationId, true);



  const fetchThreads = useCallback(
    async (isPolling = false) => {
      try {
        if (threadsFetchInitialRef.current && !isPolling) {
          setLoadingThreads(true);
          threadsFetchInitialRef.current = false;
        }
        setThreadsError(null);

        // Use tax preparer specific API endpoint
        let response;
        try {
          response = await taxPreparerThreadsAPI.getThreads();
        } catch (apiError) {
          console.log('Tax preparer chat API failed, trying fallback:', apiError);
          // Fallback to generic chat service if tax preparer API fails
          try {
            response = await chatService.getThreads();
          } catch (fallbackError) {
            throw apiError; // Throw original error
          }
        }

        // Handle new API response format (data is array directly)
        const threadsArray = response.success && response.data
          ? (Array.isArray(response.data) ? response.data : response.data.threads || [])
          : [];

        if (threadsArray.length > 0) {
          const transformedThreads = threadsArray.map(thread => {
            // Get timestamp from last_message.created_at, updated_at, or created_at
            const lastTimestamp =
              thread.last_message?.created_at ||
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

            // Handle both old and new API response formats
            const clientName = thread.client?.name || thread.client_name || "Unknown Client";
            const lastMessageText = thread.last_message?.content
              ? thread.last_message.content
              : (thread.last_message_preview
                ? thread.last_message_preview.content || "No message"
                : "No message");
            const truncatedMessage =
              lastMessageText.length > 50 ? lastMessageText.substring(0, 50) + "..." : lastMessageText;

            return {
              id: thread.id || thread.thread_id,
              name: clientName,
              lastMessage: truncatedMessage,
              time: formattedTime,
              lastMessageAt: lastTimestamp,
              status: thread.status || 'active',
              unreadCount: thread.unread_count || 0,
              createdAt: thread.created_at,
              subject: thread.subject,
              assignedStaff: thread.assigned_staff || [],
              assignedStaffNames: thread.assigned_staff?.map(s => s.name) || thread.assigned_staff_names || [],
              clientName: thread.client?.name || thread.client_name,
              clientEmail: thread.client?.email || thread.client_email,
              clientId: thread.client?.id || thread.client || thread.client_id || null,
              firmName: thread.firm_name,
              lastMessagePreview: thread.last_message || thread.last_message_preview,
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
              setShowChatOnMobile(true);
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

  const fetchAssignedClients = useCallback(async () => {
    try {
      setClientsLoading(true);
      setClientsError(null);
      const response = await taxPreparerThreadsAPI.listAssignedClients();
      let clientList = [];

      if (Array.isArray(response)) {
        clientList = response;
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          clientList = response.data;
        } else if (Array.isArray(response.data.clients)) {
          clientList = response.data.clients;
        }
      }

      if (!Array.isArray(clientList)) {
        clientList = [];
      }

      setAvailableClients(clientList);
      clientsFetchedRef.current = true;
    } catch (error) {
      console.error("Error fetching assigned clients:", error);
      setClientsError(error.message || "Failed to load clients");
    } finally {
      setClientsLoading(false);
    }
  }, []);

  const handleOpenComposeModal = () => {
    if (!clientsFetchedRef.current && !clientsLoading) {
      fetchAssignedClients();
    }
    const activeConversation = conversations.find(conv => conv.id === activeConversationId);
    const fallbackClientId = activeConversation?.clientId || sanitizedClientIdFromUrl || "";
    setComposeForm(buildComposeForm(fallbackClientId));
    setShowComposeModal(true);
  };

  const handleCloseComposeModal = () => {
    setShowComposeModal(false);
    setComposeForm(buildComposeForm());
  };

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

        // Try new chat-threads API first, fallback to old threads API
        let response;
        try {
          response = await chatService.getMessages(activeConversationId);
        } catch (newApiError) {
          console.log('New chat API failed, trying old API:', newApiError);
          response = await taxPreparerThreadsAPI.getThreadDetails(activeConversationId);
        }

        // Handle both new and old API response formats
        let messagesArray = [];
        if (response && response.success === true && response.data) {
          if (Array.isArray(response.data.messages)) {
            messagesArray = response.data.messages;
          } else if (Array.isArray(response.data)) {
            messagesArray = response.data;
          } else if (response.data.messages) {
            messagesArray = Array.isArray(response.data.messages) ? response.data.messages : [];
          }
        }

        if (messagesArray.length > 0) {
          const transformedMessages = messagesArray.map(msg => {
            // Handle both new and old API formats
            // API might return sender as object: { id, name, email, role }
            // OR as flat fields: sender_id, sender_name, sender_role
            const sender = msg.sender || {};
            const senderRole = sender.role || msg.sender_role || '';
            // Check all possible locations for sender ID
            const senderId = sender.id || msg.sender_id || msg.sender?.id || null;

            // Get current user to compare with sender - check multiple possible locations
            const currentUser = getUserData();
            const currentUserId = currentUser?.id ||
              currentUser?.user_id ||
              currentUser?.userId ||
              currentUser?.profile?.id ||
              currentUser?.profile_id ||
              null;

            // Determine if message is sent by current user (tax preparer) or received from client
            let isSentByCurrentUser = false;

            // PRIORITY 1: Check sender role first - if it's tax_preparer, it's ALWAYS from current user (right side)
            const senderRoleLower = String(senderRole).toLowerCase();
            const isTaxPreparerRole = senderRoleLower === "tax_preparer" ||
              senderRoleLower === "taxpreparer" ||
              senderRoleLower === "team_member" ||
              senderRoleLower === "teammember" ||
              senderRoleLower === "staff";

            const isClientRole = senderRoleLower === "client" ||
              senderRoleLower === "taxpayer";

            if (isTaxPreparerRole) {
              // Tax preparer messages always go to RIGHT side
              isSentByCurrentUser = true;
            } else if (isClientRole) {
              // Client messages always go to LEFT side
              isSentByCurrentUser = false;
            } else if (senderId && currentUserId) {
              // PRIORITY 2: If role doesn't match, try ID comparison
              const senderIdNum = Number(senderId);
              const currentUserIdNum = Number(currentUserId);
              isSentByCurrentUser = senderIdNum === currentUserIdNum;
            } else {
              // PRIORITY 3: Default fallback - since we're in tax preparer pane, assume right side
              isSentByCurrentUser = true;
            }

            // Debug logging
            console.log('🔍 Message alignment:', {
              messageId: msg.id,
              content: msg.content?.substring(0, 30),
              senderId: senderId,
              currentUserId: currentUserId,
              senderRole: senderRole,
              isTaxPreparerRole: isTaxPreparerRole,
              isClientRole: isClientRole,
              isSentByCurrentUser: isSentByCurrentUser,
              willAppearOn: isSentByCurrentUser ? 'RIGHT' : 'LEFT'
            });

            // Tax preparer's sent messages appear on RIGHT (type: "user")
            // Client's received messages appear on LEFT (type: "admin")
            const messageType = isSentByCurrentUser ? "user" : "admin";

            // Show "You" for messages sent by current user, otherwise show sender name
            const senderName = isSentByCurrentUser
              ? "You"
              : (sender.name || msg.sender_name || sender.email || 'Unknown');

            // Handle attachment object from API
            const attachmentObj = msg.attachment || null;
            const attachmentUrl = attachmentObj?.url || msg.attachment_url || null;
            const attachmentName = attachmentObj?.name || msg.attachment_name || null;
            const attachmentSize = attachmentObj?.size || msg.attachment_size || null;
            const attachmentSizeDisplay = attachmentSize
              ? `${(attachmentSize / 1024).toFixed(1)} KB`
              : msg.attachment_size_display || null;

            return {
              id: msg.id,
              type: messageType,
              text: msg.content || "",
              date: msg.created_at,
              sender: senderName,
              senderRole: senderRole,
              isRead: msg.is_read || false,
              isEdited: msg.is_edited || false,
              messageType: msg.message_type || "text",
              isInternal: msg.is_internal || false,
              attachment: attachmentUrl, // Keep URL for backward compatibility
              attachmentObj: attachmentObj, // Store full attachment object
              attachmentName: attachmentName,
              attachmentSize: attachmentSizeDisplay,
              hasAttachment: !!(attachmentObj || attachmentUrl),
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
          // Handle both new and old API formats
          // API might return sender as object: { id, name, email, role }
          // OR as flat fields: sender_id, sender_name, sender_role
          const sender = msg.sender || {};
          const senderRole = sender.role || msg.sender_role || '';
          // Check all possible locations for sender ID
          const senderId = sender.id || msg.sender_id || msg.sender?.id || null;

          // Get current user to compare with sender - check multiple possible locations
          const currentUser = getUserData();
          const currentUserId = currentUser?.id ||
            currentUser?.user_id ||
            currentUser?.userId ||
            currentUser?.profile?.id ||
            currentUser?.profile_id ||
            null;

          // Determine if message is sent by current user (tax preparer) or received from client
          let isSentByCurrentUser = false;

          // PRIORITY 1: Check sender role first - if it's tax_preparer, it's ALWAYS from current user (right side)
          const senderRoleLower = String(senderRole).toLowerCase();
          const isTaxPreparerRole = senderRoleLower === "tax_preparer" ||
            senderRoleLower === "taxpreparer" ||
            senderRoleLower === "team_member" ||
            senderRoleLower === "teammember" ||
            senderRoleLower === "staff";

          const isClientRole = senderRoleLower === "client" ||
            senderRoleLower === "taxpayer";

          if (isTaxPreparerRole) {
            // Tax preparer messages always go to RIGHT side
            isSentByCurrentUser = true;
          } else if (isClientRole) {
            // Client messages always go to LEFT side
            isSentByCurrentUser = false;
          } else if (senderId && currentUserId) {
            // PRIORITY 2: If role doesn't match, try ID comparison
            const senderIdNum = Number(senderId);
            const currentUserIdNum = Number(currentUserId);
            isSentByCurrentUser = senderIdNum === currentUserIdNum;
          } else {
            // PRIORITY 3: Default fallback - since we're in tax preparer pane, assume right side
            isSentByCurrentUser = true;
          }

          // Tax preparer's sent messages appear on RIGHT (type: "user")
          // Client's received messages appear on LEFT (type: "admin")
          let messageType = isSentByCurrentUser ? "user" : "admin";

          // Show "You" for messages sent by current user, otherwise show sender name
          const senderName = isSentByCurrentUser
            ? "You"
            : (sender.name || msg.sender_name || sender.email || 'Unknown');

          return {
            id: msg.id,
            type: messageType,
            text: msg.content || '',
            date: msg.created_at,
            sender: senderName,
            senderRole: senderRole,
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMessageAttachment(file);
    }
  };

  const handleSend = async () => {
    // Prevent double-sending
    if (sendingMessage) {
      console.log('⚠️ Message send already in progress, ignoring duplicate call');
      return;
    }

    if ((newMessage.trim() === "" && !messageAttachment) || !activeConversationId) return;

    // Set sending flag immediately to prevent double-sending
    setSendingMessage(true);

    const messageText = newMessage.trim();
    const attachment = messageAttachment;
    setNewMessage("");
    setMessageAttachment(null);

    // Stop typing indicator
    wsSendTyping(false);

    try {
      // Determine message type: Tax preparer's sent messages go to RIGHT
      const messageType = "user"; // Tax preparer sends → "user" (right side)

      // Optimistic update - add message instantly to chat area
      const optimisticMsg = {
        id: `temp-${Date.now()}`,
        type: messageType,
        text: messageText || (attachment ? `📎 ${attachment.name}` : ''),
        date: new Date().toISOString(),
        sender: 'You',
        senderRole: '',
        isRead: false,
        isEdited: false,
        messageType: attachment ? 'file' : 'text',
        isOptimistic: true, // Mark as optimistic
        attachment: attachment ? URL.createObjectURL(attachment) : null,
        attachmentName: attachment?.name || null,
      };

      // Add message instantly to chat area
      setActiveChatMessages(prev => [...prev, optimisticMsg].sort((a, b) => new Date(a.date) - new Date(b.date)));

      // Update conversation list instantly
      const truncatedMessage = (messageText || (attachment ? `📎 ${attachment.name}` : '')).length > 50
        ? (messageText || attachment.name).substring(0, 50) + '...'
        : (messageText || (attachment ? `📎 ${attachment.name}` : ''));

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

      // Try WebSocket first if connected (but WebSocket may not support attachments, so fallback to REST)
      if (wsConnected && !attachment) {
        const sent = wsSendMessage(messageText, false); // false = not internal
        if (sent) {
          console.log('✅ Message sent via WebSocket');
          // Message will come back via WebSocket and replace optimistic message
          setSendingMessage(false); // Reset sending flag
          return;
        }
      }

      // Fallback to REST API (required for attachments)
      const response = await taxPreparerThreadsAPI.sendMessage(activeConversationId, {
        content: messageText,
        message_type: attachment ? 'file' : 'text',
        is_internal: false
      }, attachment);

      if (response.success) {
        // Replace optimistic message with real message
        // Handle both old format (sender_role, sender_id) and new format (sender.role, sender.id)
        const sender = response.data?.sender || {};
        const senderRole = response.data?.sender_role || sender.role || '';
        const senderId = response.data?.sender_id || sender.id || null;

        // Get current user to compare with sender - check multiple possible locations
        const currentUser = getUserData();
        const currentUserId = currentUser?.id ||
          currentUser?.user_id ||
          currentUser?.userId ||
          currentUser?.profile?.id ||
          currentUser?.profile_id ||
          null;

        // Determine if message is sent by current user (tax preparer) or received from client
        let isSentByCurrentUser = false;

        // PRIORITY 1: Check sender role first - if it's tax_preparer, it's ALWAYS from current user (right side)
        const senderRoleLower = String(senderRole).toLowerCase();
        const isTaxPreparerRole = senderRoleLower === "tax_preparer" ||
          senderRoleLower === "taxpreparer" ||
          senderRoleLower === "team_member" ||
          senderRoleLower === "teammember" ||
          senderRoleLower === "staff";

        const isClientRole = senderRoleLower === "client" ||
          senderRoleLower === "taxpayer";

        if (isTaxPreparerRole) {
          // Tax preparer messages always go to RIGHT side
          isSentByCurrentUser = true;
        } else if (isClientRole) {
          // Client messages always go to LEFT side
          isSentByCurrentUser = false;
        } else if (senderId && currentUserId) {
          // PRIORITY 2: If role doesn't match, try ID comparison
          const senderIdNum = Number(senderId);
          const currentUserIdNum = Number(currentUserId);
          isSentByCurrentUser = senderIdNum === currentUserIdNum;
        } else {
          // PRIORITY 3: Default fallback - since we're in tax preparer pane, assume right side
          isSentByCurrentUser = true;
        }

        // Tax preparer's sent messages appear on RIGHT (type: "user")
        // Client's received messages appear on LEFT (type: "admin")
        const finalMessageType = isSentByCurrentUser ? "user" : "admin";

        // Handle attachment object from API response
        const attachmentObj = response.data?.attachment || null;
        const attachmentUrl = attachmentObj?.url || response.data?.attachment_url || null;
        const attachmentName = attachmentObj?.name || response.data?.attachment_name || attachment?.name || null;
        const attachmentSize = attachmentObj?.size || response.data?.attachment_size || null;
        const attachmentSizeDisplay = attachmentSize
          ? `${(attachmentSize / 1024).toFixed(1)} KB`
          : response.data?.attachment_size_display || null;

        // Show "You" for messages sent by current user, otherwise show sender name
        const senderName = isSentByCurrentUser
          ? "You"
          : (sender.name || response.data?.sender_name || 'Unknown');

        const realMsg = {
          id: response.data?.id || Date.now(),
          type: finalMessageType,
          text: messageText || (attachment ? `📎 ${attachment.name}` : ''),
          date: response.data?.created_at || new Date().toISOString(),
          sender: senderName,
          senderRole: senderRole,
          isRead: false,
          isEdited: false,
          messageType: attachment ? 'file' : 'text',
          attachment: attachmentUrl, // Keep URL for backward compatibility
          attachmentObj: attachmentObj, // Store full attachment object
          attachmentName: attachmentName,
          attachmentSize: attachmentSizeDisplay,
          hasAttachment: !!(attachment || attachmentObj || attachmentUrl),
        };

        setActiveChatMessages(prev => {
          // Remove optimistic message and add real one
          const filtered = prev.filter(m => m.id !== optimisticMsg.id);
          const exists = filtered.some(m => m.id === realMsg.id);
          if (exists) return filtered;
          return [...filtered, realMsg].sort((a, b) => new Date(a.date) - new Date(b.date));
        });

        // Fetch messages again to ensure attachment is properly loaded
        setTimeout(async () => {
          try {
            const refreshResponse = await chatService.getMessages(activeConversationId);
            if (refreshResponse.success && refreshResponse.data) {
              const messagesArray = Array.isArray(refreshResponse.data.messages)
                ? refreshResponse.data.messages
                : (Array.isArray(refreshResponse.data) ? refreshResponse.data : []);

              if (messagesArray.length > 0) {
                const refreshedMessages = messagesArray.map(msg => {
                  // Handle both new and old API formats
                  // API might return sender as object: { id, name, email, role }
                  // OR as flat fields: sender_id, sender_name, sender_role
                  const sender = msg.sender || {};
                  const senderRole = sender.role || msg.sender_role || '';
                  // Check all possible locations for sender ID
                  const senderId = sender.id || msg.sender_id || msg.sender?.id || null;

                  // Get current user to compare with sender - check multiple possible locations
                  const currentUser = getUserData();
                  const currentUserId = currentUser?.id ||
                    currentUser?.user_id ||
                    currentUser?.userId ||
                    currentUser?.profile?.id ||
                    currentUser?.profile_id ||
                    null;

                  let isSentByCurrentUser = false;

                  // PRIORITY 1: Check sender role first - if it's tax_preparer, it's ALWAYS from current user (right side)
                  const senderRoleLower = String(senderRole).toLowerCase();
                  const isTaxPreparerRole = senderRoleLower === "tax_preparer" ||
                    senderRoleLower === "taxpreparer" ||
                    senderRoleLower === "team_member" ||
                    senderRoleLower === "teammember" ||
                    senderRoleLower === "staff";

                  const isClientRole = senderRoleLower === "client" ||
                    senderRoleLower === "taxpayer";

                  if (isTaxPreparerRole) {
                    // Tax preparer messages always go to RIGHT side
                    isSentByCurrentUser = true;
                  } else if (isClientRole) {
                    // Client messages always go to LEFT side
                    isSentByCurrentUser = false;
                  } else if (senderId && currentUserId) {
                    // PRIORITY 2: If role doesn't match, try ID comparison
                    const senderIdNum = Number(senderId);
                    const currentUserIdNum = Number(currentUserId);
                    isSentByCurrentUser = senderIdNum === currentUserIdNum;
                  } else {
                    // PRIORITY 3: Default fallback - since we're in tax preparer pane, assume right side
                    isSentByCurrentUser = true;
                  }

                  // Tax preparer's sent messages appear on RIGHT (type: "user")
                  // Client's received messages appear on LEFT (type: "admin")
                  const messageType = isSentByCurrentUser ? "user" : "admin";

                  // Show "You" for messages sent by current user, otherwise show sender name
                  const senderName = isSentByCurrentUser
                    ? "You"
                    : (sender.name || msg.sender_name || sender.email || 'Unknown');

                  const msgAttachmentObj = msg.attachment || null;
                  const msgAttachmentUrl = msgAttachmentObj?.url || msg.attachment_url || null;
                  const msgAttachmentName = msgAttachmentObj?.name || msg.attachment_name || null;
                  const msgAttachmentSize = msgAttachmentObj?.size || msg.attachment_size || null;
                  const msgAttachmentSizeDisplay = msgAttachmentSize
                    ? `${(msgAttachmentSize / 1024).toFixed(1)} KB`
                    : msg.attachment_size_display || null;

                  return {
                    id: msg.id,
                    type: messageType,
                    text: msg.content || "",
                    date: msg.created_at,
                    sender: senderName,
                    senderRole: senderRole,
                    isRead: msg.is_read || false,
                    isEdited: msg.is_edited || false,
                    messageType: msg.message_type || "text",
                    isInternal: msg.is_internal || false,
                    attachment: msgAttachmentUrl,
                    attachmentObj: msgAttachmentObj,
                    attachmentName: msgAttachmentName,
                    attachmentSize: msgAttachmentSizeDisplay,
                    hasAttachment: !!(msgAttachmentObj || msgAttachmentUrl),
                  };
                });

                setActiveChatMessages(refreshedMessages);

                // Auto-scroll to bottom after refresh
                setTimeout(() => {
                  if (messagesEndRef.current) {
                    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
                  }
                }, 100);
              }
            }
          } catch (refreshError) {
            console.error('Error refreshing messages after attachment send:', refreshError);
          }
        }, 1000); // Increased delay to allow server to process attachment

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
      setMessageAttachment(attachment);
      toast.error('Failed to send message: ' + err.message, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      // Always reset sending flag
      setSendingMessage(false);
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

  const handleDeleteThread = async (threadId, e) => {
    e.stopPropagation(); // Prevent conversation selection
    setThreadToDelete(threadId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteThread = async () => {
    if (!threadToDelete) return;

    try {
      setDeleting(true);

      // Try chatService first, fallback to taxPreparerThreadsAPI
      try {
        await chatService.deleteThread(threadToDelete);
      } catch (error) {
        console.log('chatService.deleteThread failed, trying taxPreparerThreadsAPI:', error);
        // Note: taxPreparerThreadsAPI might not have deleteThread, so we'll try chatService only
        throw error;
      }

      // Remove from conversations list
      setConversations(prev => prev.filter(conv => conv.id !== threadToDelete));

      // If deleted conversation was active, clear it
      if (activeConversationId === threadToDelete) {
        setActiveConversationId(null);
        setActiveChatMessages([]);
      }

      toast.success('Thread deleted successfully', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Error deleting thread:', err);
      toast.error('Failed to delete thread: ' + (err.message || 'Unknown error'), {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setThreadToDelete(null);
    }
  };

  // Fetch threads from API (initial load and periodic polling)

  useEffect(() => {
    fetchThreads(false);
    const intervalId = setInterval(() => {
      fetchThreads(true);
    }, 10000);
    return () => clearInterval(intervalId);
  }, [fetchThreads]);

  useEffect(() => {
    if (showComposeModal && !clientsFetchedRef.current && !clientsLoading) {
      fetchAssignedClients();
    }
  }, [showComposeModal, clientsLoading, fetchAssignedClients]);
  const renderHeader = () => (
    <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex-shrink-0 min-h-[80px]">
      <div className="sm:text-left">
        <h5 className="text-2xl font-bold text-gray-900 font-basis-grotesque">
          Messages
        </h5>
        <span className="text-sm text-gray-500 font-basis-grotesque">
          Communicate with clients and team members
        </span>
      </div>

      <button
        className="flex items-center gap-2 px-4 py-2 !rounded-xl bg-[#F56D2D] text-white font-semibold shadow-md hover:bg-[#e55a1a] !text-xs transition-all transform hover:-translate-y-0.5 uppercase"
        onClick={handleOpenComposeModal}
      >
        <PLusIcon />
        <span>New Message</span>
      </button>
    </div>
  );

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
    <div className="flex flex-col h-full">
      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .animate-slide-up {
            animation: slideUp 0.3s ease-out;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 0;
            display: none;
          }
          .custom-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>

      {isMobile && renderHeader()}

      <div className="flex flex-1 overflow-hidden gap-6">

        {/* Left Column - Conversations */}
        <div
          className={`flex-col bg-white shadow-sm border border-gray-200 rounded-3xl transition-all duration-300
            ${isMobile && showChatOnMobile ? 'hidden' : 'flex'} 
            ${isMobile ? 'w-full' : 'w-[380px]'} h-full overflow-hidden`}
        >
          <div className="p-4 space-y-4 flex-shrink-0">
            <h5 className="text-lg font-bold text-gray-800">Conversations</h5>

            <div className="relative group">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#F56D2D] transition-colors" size={14} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#F56D2D]/20 focus:border-[#F56D2D] outline-none transition-all text-sm"
              />
            </div>

            <div className="relative">
              <select
                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm text-gray-600 cursor-pointer appearance-none transition-all focus:bg-white hover:bg-gray-100"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='%234A5568' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 15px center"
                }}
              >
                <option value="all">All Conversations</option>
                <option value="unread">Unread Messages</option>
                <option value="active">Active Threads</option>
                <option value="closed">Closed Threads</option>
              </select>
            </div>
          </div>

          <div className="px-4 p flex-1 overflow-y-auto custom-scrollbar">
            {(() => {
              const filteredConversations = conversations.filter(conv => {
                const term = searchTerm.toLowerCase();
                const matchesSearch = (
                  (conv.name && conv.name.toLowerCase().includes(term)) ||
                  (conv.subject && conv.subject.toLowerCase().includes(term)) ||
                  (conv.lastMessage && conv.lastMessage.toLowerCase().includes(term))
                );

                if (filterStatus === "active") return matchesSearch && conv.status === "active";
                if (filterStatus === "closed") return matchesSearch && conv.status === "closed";
                if (filterStatus === "unread") return matchesSearch && conv.unreadCount > 0;
                return matchesSearch;
              });

              // 1. Loading State
              if (loadingThreads && conversations.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center h-48 space-y-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl border-2 border-gray-100 border-t-[#F56D2D] animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#F56D2D] animate-pulse"></div>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-400 tracking-tight">Syncing inbox...</p>
                  </div>
                );
              }

              // 2. Error State
              if (threadsError && conversations.length === 0) {
                return (
                  <div className="p-8 m-4 rounded-3xl bg-rose-50/50 border border-rose-100 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-500 mb-4 font-black">!</div>
                    <h4 className="text-rose-900 font-bold mb-1">Connection failed</h4>
                    <p className="text-rose-600/70 text-sm mb-4 max-w-[200px]">We couldn't reach the server to load your messages.</p>
                    <button
                      onClick={() => fetchThreads()}
                      className="w-full py-3 bg-white border border-rose-200 text-rose-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-100 transition-all active:scale-95"
                    >
                      Retry Connection
                    </button>
                  </div>
                );
              }

              // 3. Global Empty State
              if (conversations.length === 0) {
                return (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p className="text-sm">No conversations found</p>
                  </div>
                );
              }

              return filteredConversations.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`pl-4 py-4 rounded-2xl cursor-pointer transition-all duration-200 border 
                        ${activeConversationId === conv.id
                          ? "!border-l-4 !border-l-[#F56D2D] shadow-sm shadow-[#F56D2D]/10"
                          : "border-l hover:bg-gray-50"
                        }`}
                      onClick={() => {
                        setActiveConversationId(conv.id);
                        if (isMobile) setShowChatOnMobile(true);
                      }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        {/* 1. Avatar Column */}
                        <div className="flex-shrink-0 relative items-center">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm transition-all duration-300 border ${activeConversationId === conv.id ? 'border-[#F56D2D]/30 scale-105 shadow-md' : 'border-gray-100 group-hover:border-gray-200'}`}>
                            <ConverIcon color={conv.id === activeConversationId ? "#F56D2D" : "#64748B"} size={22} />
                          </div>
                          {conv.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center bg-rose-500 text-white text-[10px] h-5 w-5 rounded-full font-black border-2 border-white shadow-sm">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>

                        {/* 2. Content Column */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          {/* Header Row: Name & Time & Delete */}
                          <div className="flex justify-between items-start ">
                            <div className="flex flex-1 justify-between min-w-0">
                              <h6 className={`mb-0 text-sm font-black truncate transition-colors leading-tight ${activeConversationId === conv.id ? 'text-[#F56D2D]' : 'text-gray-900 group-hover:text-[#F56D2D]'}`}>
                                {conv.name}
                              </h6>
                              <span className="!text-[10px] text-gray-400 font-bold uppercase tracking-tight">{conv.time}</span>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteThread(conv.id, e);
                              }}
                              className="text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all active:scale-90 flex-shrink-0"
                              title="Delete conversation"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18M19 6V20a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                              </svg>
                            </button>
                          </div>

                          {/* Message Preview */}
                          <p className={`text-[13px] line-clamp-1 ${conv.unreadCount > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'} mb-1`}>
                            {conv.lastMessage || 'No recent messages'}
                          </p>

                          {/* Subject Tag */}
                          {conv.subject && (
                            <div className="flex items-center gap-2 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100/50 w-fit">
                              <span className="text-[9px] font-black text-[#F56D2D] uppercase tracking-widest opacity-80">Subject</span>
                              <span className="text-[10px] text-gray-600 font-bold truncate max-w-[150px]">{conv.subject}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !loadingThreads && !threadsError && conversations.length > 0 && filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 space-y-2">
                  <p className="text-gray-400 text-sm">No matches for "{searchTerm}"</p>
                </div>
              ) : null;
            })()}
          </div>
        </div>

        {/* Right Column - Chat Interface Wrapper */}
        <div className={`flex-grow-1 flex-col overflow-hidden min-w-0 ${isMobile && !showChatOnMobile ? 'hidden' : 'flex'}`}>
          {!isMobile && renderHeader()}

          <div className="flex-1 bg-white shadow-sm border border-gray-100 rounded-3xl flex flex-col overflow-hidden">
            {(() => {
              const activeConversation = conversations.find(c => c.id === activeConversationId);
              return activeConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                      {isMobile && (
                        <button
                          className="p-2 -ml-2 text-gray-500 hover:text-[#F56D2D] transition-colors"
                          onClick={() => setShowChatOnMobile(false)}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white ">
                        <ConverIcon size={20} />
                      </div>
                      <div>
                        <h6 className="text-base font-bold text-gray-900 leading-none">{activeConversation.name}</h6>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${activeConversation.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-widest">
                            {activeConversation.status === 'active' ? 'Online' : 'Closed'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    ref={messagesContainerRef}
                    className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar animate-slide-up"
                  >
                    {loadingMessages ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-4 py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#F56D2D] border-t-transparent"></div>
                        <p className="text-xs font-medium text-gray-500">Decrypting messages...</p>
                      </div>
                    ) : activeChatMessages.length > 0 ? (
                      <>
                        {activeChatMessages.map((msg) => {
                          const isSentByMe = msg.type === "user";
                          return (
                            <div key={msg.id} className={`flex w-full ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] space-y-1`}>
                                {!isSentByMe && (
                                  <span className="text-[10px] font-bold text-gray-400 ml-2 uppercase tracking-widest">{msg.sender}</span>
                                )}

                                <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm ${isSentByMe
                                  ? 'bg-[#F56D2D] text-white rounded-tr-none'
                                  : 'bg-gray-100 text-gray-800 rounded-tl-none'
                                  }`}>
                                  {msg.text && <span className="mb-2 leading-relaxed">{msg.text}</span>}

                                  {msg.hasAttachment && (
                                    <div className={`flex items-center gap-3 p-3 rounded-xl border ${isSentByMe ? 'bg-white/10 border-white/20' : 'bg-white border-gray-200'
                                      }`}>
                                      <div className={`p-2 rounded-lg ${isSentByMe ? 'bg-white/20' : 'bg-[#F56D2D]/10'}`}>
                                        <FileIcon className={isSentByMe ? 'text-white' : 'text-[#F56D2D]'} size={18} />
                                      </div>
                                      <div className="flex flex-col overflow-hidden">
                                        <a
                                          href={msg.attachment || msg.attachmentObj?.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`font-bold text-xs truncate underline ${isSentByMe ? 'text-white' : 'text-[#F56D2D]'}`}
                                        >
                                          {msg.attachmentName || "Attachment"}
                                        </a>
                                        {msg.attachmentSize && (
                                          <span className={`text-[10px] ${isSentByMe ? 'text-white/70' : 'text-gray-400'}`}>
                                            {msg.attachmentSize}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  <div className={`flex items-center gap-2 mt-2 text-[10px] ${isSentByMe ? 'text-white/60' : 'text-gray-400'}`}>
                                    <span>{new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {msg.isEdited && <span className="italic">(edited)</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-2 py-12">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                          <Message3Icon size={32} className="text-gray-200" />
                        </div>
                        <h4 className="text-gray-400 font-bold">New Connection</h4>
                        <p className="text-xs text-gray-400">Be the first to say something!</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-white border-t border-gray-50 flex-shrink-0">
                    <div className="flex flex-col gap-3">
                      {/* Connection & Typing indicators */}
                      <div className="flex items-center gap-3 px-1 h-4">
                        <div className="flex gap-1.5 items-center">
                          {wsConnected ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Connected"></span>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" title="Disconnected"></span>
                          )}
                          <span className={`text-[10px] font-black uppercase tracking-tighter ${wsConnected ? 'text-emerald-600/70' : 'text-rose-600/70'}`}>
                            {wsConnected ? 'Live' : 'Offline'}
                          </span>
                        </div>

                        {typingUsers.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              <span className="w-1 h-1 rounded-full bg-gray-300 animate-[bounce_1s_infinite_0s]"></span>
                              <span className="w-1 h-1 rounded-full bg-gray-300 animate-[bounce_1s_infinite_0.2s]"></span>
                              <span className="w-1 h-1 rounded-full bg-gray-300 animate-[bounce_1s_infinite_0.4s]"></span>
                            </div>
                            <span className="text-[11px] text-gray-400 font-medium italic">
                              {typingUsers.map(u => u.name).join(', ')} typing...
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="relative flex items-center gap-3 bg-gray-50/50 p-2 rounded-2xl border border-gray-100/80 transition-all focus-within:bg-white focus-within:border-[#F56D2D]/20 focus-within:shadow-[0_10px_40px_-15px_rgba(245,109,45,0.1)]">
                        <input
                          ref={messageFileInputRef}
                          type="file"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <button
                          type="button"
                          className="flex-shrink-0 w-10 h-10 !rounded-xl bg-white text-gray-500 border border-gray-100 flex items-center justify-center hover:bg-[#F56D2D]/5 hover:text-[#F56D2D] hover:border-[#F56D2D]/20 transition-all shadow-sm active:scale-95 group"
                          onClick={() => messageFileInputRef.current?.click()}
                          title="Attach file"
                        >
                          <FaLink />
                        </button>

                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            className="w-full bg-transparent border-none py-2.5 px-1 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-0 outline-none font-medium"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={handleTyping}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !sendingMessage) {
                                e.preventDefault();
                                handleSend();
                              }
                            }}
                          />
                        </div>

                        {messageAttachment && (
                          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-gray-100 animate-slide-up max-w-[140px]">
                            <div className="w-5 h-5 rounded-md bg-[#F56D2D]/10 flex items-center justify-center">
                              <FileIcon size={12} className="text-[#F56D2D]" />
                            </div>
                            <span className="text-[10px] font-bold text-gray-700 truncate">{messageAttachment.name}</span>
                            <button
                              onClick={() => setMessageAttachment(null)}
                              className="w-4 h-4 rounded-full flex items-center justify-center text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                            >
                              <Crossing size={10} />
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          className={`flex-shrink-0 w-10 h-10 !rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 ${(newMessage.trim() || messageAttachment) && !sendingMessage
                            ? "bg-[#F56D2D] text-white shadow-[#F56D2D]/30 hover:shadow-[#F56D2D]/40 hover:-translate-y-0.5"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                            }`}
                          onClick={handleSend}
                          disabled={!(newMessage.trim() || messageAttachment) || sendingMessage}
                        >
                          <FaPaperPlane className={`text-sm ${sendingMessage ? 'animate-pulse' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-gray-50/50 space-y-4">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-gray-200/50 flex items-center justify-center animate-bounce">
                    <Message3Icon size={40} className="text-[#F56D2D]" />
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-black text-gray-800">Your Inbox</h3>
                    <p className="text-sm text-gray-400 max-w-xs">Select a conversation from the sidebar to start collaborating with your clients.</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>



      {/* Compose Message Modal */}
      {
        showComposeModal && (
          <div className="compose-modal-wrapper" style={{
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
            onClick={handleCloseComposeModal}
          >
            <div className="compose-modal-box" style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "40px",
              width: "95%",
              maxWidth: "700px",
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              position: "relative",
              marginTop: "60px",
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
                  <h4 className="compose-modal-title" style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    color: "#1A202C",
                    margin: "0 0 8px 0",
                    lineHeight: "1.2"
                  }}>
                    Compose Message
                  </h4>
                  <p style={{
                    fontSize: "16px",
                    color: "#718096",
                    margin: 0,
                    lineHeight: "1.4"
                  }}>
                    Send a new message to a client.
                  </p>
                </div>
                <button
                  onClick={handleCloseComposeModal}
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
                {/* Select Client */}
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#2D3748",
                    marginBottom: "12px"
                  }}>
                    Select Client <span style={{ color: "#F56D2D" }}>*</span>
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {clientsLoading ? (
                      <div style={{ padding: "12px 0" }}>
                        <span style={{ fontSize: "14px", color: "#718096" }}>Loading clients...</span>
                      </div>
                    ) : (
                      <select
                        value={composeForm.clientId}
                        onChange={(e) => setComposeForm({ ...composeForm, clientId: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "16px",
                          border: "1px solid #E2E8F0",
                          borderRadius: "12px",
                          fontSize: "16px",
                          backgroundColor: "#FAFAFA",
                          outline: "none"
                        }}
                      >
                        <option value="">Select a client</option>
                        {availableClients
                          .filter(client => {
                            // Don't show clients who already have a thread
                            const existingThread = conversations.find(conv =>
                              conv.clientId?.toString() === client.id?.toString()
                            );
                            return !existingThread;
                          })
                          .map((client) => {
                            const fullName = `${client.first_name || ''} ${client.last_name || ''}`.trim();
                            const label = fullName || client.email || `Client #${client.id}`;
                            const secondary = client.email && fullName ? ` (${client.email})` : "";
                            return (
                              <option key={client.id} value={client.id}>
                                {label}{secondary}
                              </option>
                            );
                          })
                        }
                      </select>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <button
                        type="button"
                        onClick={fetchAssignedClients}
                        style={{
                          backgroundColor: "#EDF2F7",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 12px",
                          fontSize: "14px",
                          color: "#4A5568",
                          cursor: "pointer"
                        }}
                      >
                        Refresh Clients
                      </button>
                      {clientsError && (
                        <span style={{ color: "#E53E3E", fontSize: "13px" }}>{clientsError}</span>
                      )}
                      {!clientsLoading && !clientsError && availableClients.length === 0 && (
                        <span style={{ color: "#718096", fontSize: "13px" }}>No assigned clients found.</span>
                      )}
                    </div>
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
                    Opening Message
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
                  onClick={handleCloseComposeModal}
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
                      if (!composeForm.clientId) {
                        toast.error('Please select a client', {
                          position: "top-right",
                          autoClose: 3000,
                        });
                        return;
                      }

                      const clientIdNumber = parseInt(composeForm.clientId, 10);
                      if (Number.isNaN(clientIdNumber)) {
                        toast.error('Invalid client selected', {
                          position: "top-right",
                          autoClose: 3000,
                        });
                        return;
                      }

                      // Use the new chat/create endpoint with all fields for backend enforcement
                      const response = await chatService.createTaxPreparerChat(clientIdNumber, {
                        subject: composeForm.subject,
                        category: composeForm.category,
                        priority: composeForm.priority,
                        opening_message: composeForm.message.trim()
                      });

                      // Handle response - could be success/data format or direct data
                      const chatData = response.success ? response.data : response;
                      if (!chatData) {
                        throw new Error('Invalid response received from server');
                      }

                      // Extract chat/thread ID from response
                      // IMPORTANT: Prioritize thread_id (Modern system) over id (Legacy chat system)
                      const chatId = chatData.thread_id || chatData.id || chatData.chat_id;
                      if (!chatId) {
                        throw new Error('Chat ID not found in response');
                      }

                      console.log('New chat created, setting active ID:', chatId, 'Original IDs:', {
                        id: chatData.id,
                        thread_id: chatData.thread_id
                      });

                      // Set the active conversation to the new chat
                      setActiveConversationId(chatId);

                      // Refresh threads to get the new chat in the list
                      await fetchThreads(true);

                      toast.success('Chat created successfully', {
                        position: "top-right",
                        autoClose: 3000,
                      });

                      handleCloseComposeModal();
                    } catch (err) {
                      console.error('Error creating thread:', err);
                      toast.error('Failed to create thread: ' + (err.message || 'Unknown error'), {
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
        )
      }

      {/* Delete Confirmation Modal */}
      {
        showDeleteConfirm && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ background: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
            <div className="bg-white p-4" style={{ width: "400px", border: "1px solid #E8F0FF", borderRadius: "16px" }}>
              <h5 className="mb-3" style={{ color: "#3B4A66", fontSize: "20px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Delete Thread</h5>
              <p className="mb-4" style={{ color: "#4B5563", fontSize: "14px", fontFamily: "BasisGrotesquePro" }}>
                Are you sure you want to delete this conversation? This action cannot be undone.
              </p>
              <div className="d-flex justify-content-end gap-2">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setThreadToDelete(null);
                  }}
                  disabled={deleting}
                  style={{ fontFamily: "BasisGrotesquePro" }}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={confirmDeleteThread}
                  disabled={deleting}
                  style={{
                    backgroundColor: "#EF4444",
                    color: "#FFFFFF",
                    fontFamily: "BasisGrotesquePro"
                  }}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
