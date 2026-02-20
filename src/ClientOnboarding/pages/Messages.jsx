import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaPaperPlane, FaSearch } from "react-icons/fa";
import { ConverIcon, JdIcon, FileIcon, PlusIcon, DiscusIcon, PLusIcon } from "../components/icons";
import { getAccessToken, getUserData } from "../utils/userUtils";
import { getApiBaseUrl } from "../utils/corsConfig";
import { threadsAPI } from "../utils/apiUtils";
import { useThreadWebSocket } from "../utils/useThreadWebSocket";
import { chatService } from "../utils/chatService";
import { useChatWebSocket } from "../utils/useChatWebSocket";
import { toast } from "react-toastify";
import "../styles/Messages.css";
export default function Messages() {
  const location = useLocation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(location.search);
  const threadIdFromUrl = urlParams.get('threadId');
  const clientIdFromUrl = urlParams.get('clientId');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [chatSubject, setChatSubject] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [messageAttachment, setMessageAttachment] = useState(null);
  const messageFileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChatMessages, setActiveChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [superadminId, setSuperadminId] = useState("");
  const [creatingChat, setCreatingChat] = useState(false);
  const [superadmins, setSuperadmins] = useState([]);
  const [loadingSuperadmins, setLoadingSuperadmins] = useState(false);
  const typingTimeoutRef = useRef(null);
  const threadsFetchInitialRef = useRef(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredConversations = conversations.filter(conv => {
    const term = searchTerm.toLowerCase();
    return (
      (conv.name && conv.name.toLowerCase().includes(term)) ||
      (conv.subject && conv.subject.toLowerCase().includes(term)) ||
      (conv.lastMessage && conv.lastMessage.toLowerCase().includes(term)) ||
      (conv.clientName && conv.clientName.toLowerCase().includes(term))
    );
  });

  const isSendButtonActive = newMessage.trim().length > 0 || messageAttachment;
  const sendButtonStyles = {
    background: isSendButtonActive ? "#F56D2D" : "#E5E7EB",
    color: isSendButtonActive ? "#fff" : "#9CA3AF",
    cursor: isSendButtonActive ? "pointer" : "not-allowed"
  };

  const API_BASE_URL = getApiBaseUrl();

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

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const sortConversationsByRecent = (items = []) =>
    [...items].sort(
      (a, b) =>
        new Date(b.lastMessageAt || b.createdAt || 0) - new Date(a.lastMessageAt || a.createdAt || 0)
    );

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

  const fetchChats = useCallback(
    async (isPolling = false) => {
      try {
        if (threadsFetchInitialRef.current && !isPolling) {
          setLoading(true);
          threadsFetchInitialRef.current = false;
        }
        setError(null);

        // Try new chat-threads API first, fallback to old threads API
        let response;
        try {
          response = await chatService.getThreads();
        } catch (newApiError) {
          console.log('New chat API failed, trying old API:', newApiError);
          response = await threadsAPI.getThreads();
        }

        // Handle new API response format (data is array directly)
        const threadsArray = response.success && response.data
          ? (Array.isArray(response.data) ? response.data : response.data.threads || [])
          : [];

        if (threadsArray.length > 0) {
          const transformedChats = threadsArray.map(thread => {
            const lastTimestamp =
              thread.last_message_at ||
              thread.updated_at ||
              thread.created_at ||
              new Date().toISOString();

            // Handle both old and new API response formats
            const staffNames = thread.assigned_staff && thread.assigned_staff.length > 0
              ? thread.assigned_staff.map(s => s.name || s.email || 'Staff').join(", ")
              : (thread.assigned_staff_names && thread.assigned_staff_names.length > 0
                ? thread.assigned_staff_names.join(", ")
                : "Tax Professional");

            const lastMessageText = thread.last_message?.content
              ? thread.last_message.content
              : (thread.last_message_preview
                ? thread.last_message_preview.content || "No message"
                : "No message");

            return {
              id: thread.id || thread.thread_id,
              name: staffNames,
              lastMessage: lastMessageText,
              time: formatRelativeTime(lastTimestamp),
              lastMessageAt: lastTimestamp,
              status: thread.status || 'active',
              unreadCount: thread.unread_count || 0,
              createdAt: thread.created_at,
              subject: thread.subject,
              assignedStaff: thread.assigned_staff || [],
              assignedStaffNames: thread.assigned_staff?.map(s => s.name) || thread.assigned_staff_names || [],
              clientName: thread.client?.name || thread.client_name,
              firmName: thread.firm_name,
              clientId: thread.client?.id || thread.client || thread.client_id || null,
              lastMessagePreview: thread.last_message || thread.last_message_preview,
              messages: [],
            };
          });

          const sortedChats = sortConversationsByRecent(transformedChats);

          // Preserve existing subjects when updating conversations
          setConversations(prevConvs => {
            const mergedChats = sortedChats.map(newChat => {
              const existingChat = prevConvs.find(conv => conv.id === newChat.id);
              // Preserve subject from existing conversation if new one doesn't have it
              return {
                ...newChat,
                subject: newChat.subject || (existingChat ? existingChat.subject : null),
              };
            });
            return sortConversationsByRecent(mergedChats);
          });

          if (threadIdFromUrl || clientIdFromUrl) {
            let targetThread = null;
            if (threadIdFromUrl) {
              targetThread = sortedChats.find(
                conv => conv.id.toString() === threadIdFromUrl.toString()
              );
            } else if (clientIdFromUrl) {
              targetThread = sortedChats.find(
                conv => conv.clientId && conv.clientId.toString() === clientIdFromUrl.toString()
              );
            }

            if (targetThread) {
              setActiveConversationId(targetThread.id);
              navigate(location.pathname, { replace: true });
            } else if (sortedChats.length > 0 && !activeConversationId) {
              setActiveConversationId(sortedChats[0].id);
            }
          } else if (sortedChats.length > 0 && !activeConversationId) {
            setActiveConversationId(sortedChats[0].id);
          }
        } else {
          setConversations([]);
        }
      } catch (err) {
        console.error("Error fetching threads:", err);
        if (!isPolling) {
          setError(err.message || "Failed to load chats");
        }
      } finally {
        if (!isPolling) {
          setLoading(false);
        }
      }
    },
    [threadIdFromUrl, clientIdFromUrl, activeConversationId, navigate, location.pathname]
  );

  useEffect(() => {
    fetchChats(false);
    const intervalId = setInterval(() => {
      fetchChats(true);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [fetchChats]);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  ) || null;

  // Fetch messages for active conversation (initial load and periodic polling)
  useEffect(() => {
    let isInitialFetch = true;

    const fetchMessages = async (isPolling = false) => {
      if (!activeConversationId) {
        setActiveChatMessages([]);
        setLoadingMessages(false);
        return;
      }

      try {
        // Only show loading on initial fetch, not on periodic updates
        if (isInitialFetch && !isPolling) {
          setLoadingMessages(true);
          isInitialFetch = false;
        }

        console.log('Fetching messages for thread:', activeConversationId);
        // Try new chat-threads API first, fallback to old threads API
        let response;
        try {
          response = await chatService.getMessages(activeConversationId);
        } catch (newApiError) {
          console.log('New chat API failed, trying old API:', newApiError);
          response = await threadsAPI.getThreadDetails(activeConversationId);
        }
        console.log('Thread details response:', response);

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
        console.log('Messages array length:', messagesArray.length);

        if (messagesArray.length > 0) {
          // Transform messages to match component structure
          const transformedMessages = messagesArray.map(msg => {
            // Handle both new and old API formats
            const sender = msg.sender || {};
            const senderName = sender.name || msg.sender_name || sender.email || 'Unknown';
            const senderRole = sender.role || msg.sender_role || '';
            const senderId = sender.id || msg.sender_id || null;

            // Get current user to compare with sender
            const currentUser = getUserData();
            const currentUserId = currentUser?.id || currentUser?.user_id || currentUser?.userId;
            const currentUserEmail = currentUser?.email || '';

            // Determine if message is sent by current user (client) or received from staff/admin
            let messageType = "admin"; // Default to received (left side)
            if (senderId && currentUserId) {
              // If sender ID matches current user ID, it's a sent message (right side)
              const isSentByCurrentUser = String(senderId) === String(currentUserId) || senderId === currentUserId;
              messageType = isSentByCurrentUser ? "user" : "admin";
            } else if (senderName && currentUserEmail) {
              // Fallback: Compare by email
              const senderEmail = sender.email || senderName;
              const isSentByCurrentUser = senderEmail.toLowerCase() === currentUserEmail.toLowerCase();
              messageType = isSentByCurrentUser ? "user" : "admin";
            } else {
              // Final fallback: If sender is staff/admin, it's received (left side)
              const isStaff = senderRole === "staff" || senderRole === "Admin" || senderRole === "Staff" || senderRole === "Accountant" || senderRole === "Bookkeeper" || senderRole === "Assistant";
              messageType = isStaff ? "admin" : "user";
            }

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
              text: msg.content || '',
              date: msg.created_at,
              sender: senderName,
              senderRole: senderRole,
              isRead: msg.is_read || false,
              isEdited: msg.is_edited || false,
              messageType: msg.message_type || 'text',
              attachment: attachmentUrl, // Keep URL for backward compatibility
              attachmentObj: attachmentObj, // Store full attachment object
              attachmentName: attachmentName,
              attachmentSize: attachmentSizeDisplay,
              hasAttachment: !!(attachmentObj || attachmentUrl),
            };
          });

          console.log('Transformed messages:', transformedMessages);

          // Update messages - will merge with existing if polling
          setActiveChatMessages(prev => {
            // Check if messages have changed
            const prevIds = new Set(prev.map(m => m.id));
            const newIds = new Set(transformedMessages.map(m => m.id));

            // If same messages, don't update
            if (prevIds.size === newIds.size &&
              [...prevIds].every(id => newIds.has(id)) &&
              [...newIds].every(id => prevIds.has(id))) {
              return prev;
            }

            return transformedMessages;
          });

          // Update conversation's last message in the list
          if (transformedMessages.length > 0) {
            const lastMessage = transformedMessages[transformedMessages.length - 1];
            const lastTimestamp = lastMessage.date || new Date().toISOString();
            setConversations(prevConvs => {
              const updated = prevConvs.map(conv =>
                conv.id === activeConversationId
                  ? {
                    ...conv,
                    lastMessage: lastMessage.text,
                    time: formatRelativeTime(lastTimestamp),
                    lastMessageAt: lastTimestamp,
                    messages: transformedMessages,
                    // Ensure subject is preserved
                    subject: conv.subject || thread.subject,
                  }
                  : conv
              );
              return sortConversationsByRecent(updated);
            });
          }

          // Mark messages as read via WebSocket
          transformedMessages.forEach(msg => {
            if (!msg.isRead && msg.type === "admin") {
              wsMarkAsRead(msg.id);
            }
          });

          // Auto-scroll to bottom after initial load
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            }
          }, 100);
        } else {
          setActiveChatMessages([]);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        // Don't clear messages on error during polling
        if (!isPolling) {
          setActiveChatMessages([]);
        }
      } finally {
        if (!isPolling) {
          setLoadingMessages(false);
        }
      }
    };

    // Initial fetch
    fetchMessages(false);

    // Set up periodic polling every 3 seconds to fetch new messages
    const intervalId = setInterval(() => {
      if (activeConversationId) {
        fetchMessages(true); // Pass true to indicate this is a polling call
      }
    }, 3000); // Poll every 3 seconds

    // Cleanup interval on unmount or when activeConversationId changes
    return () => {
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

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
          const sender = msg.sender || {};
          const senderName = sender.name || msg.sender_name || sender.email || 'Unknown';
          const senderRole = sender.role || msg.sender_role || '';
          const senderId = sender.id || msg.sender_id || null;

          // Get current user to compare with sender
          const currentUser = getUserData();
          const currentUserId = currentUser?.id || currentUser?.user_id || currentUser?.userId;
          const currentUserEmail = currentUser?.email || '';

          // Determine if message is sent by current user (client) or received from staff/admin
          let messageType = "admin"; // Default to received (left side)
          if (senderId && currentUserId) {
            // If sender ID matches current user ID, it's a sent message (right side)
            const isSentByCurrentUser = String(senderId) === String(currentUserId) || senderId === currentUserId;
            messageType = isSentByCurrentUser ? "user" : "admin";
          } else if (senderName && currentUserEmail) {
            // Fallback: Compare by email
            const senderEmail = sender.email || senderName;
            const isSentByCurrentUser = senderEmail.toLowerCase() === currentUserEmail.toLowerCase();
            messageType = isSentByCurrentUser ? "user" : "admin";
          } else {
            // Final fallback: If sender is staff/admin, it's received (left side)
            const isStaff = senderRole === "staff" || senderRole === "Admin" || senderRole === "Staff" || senderRole === "Accountant" || senderRole === "Bookkeeper" || senderRole === "Assistant";
            messageType = isStaff ? "admin" : "user";
          }

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

        // Update conversation's last message instantly
        if (transformedMessages.length > 0) {
          const lastMessage = transformedMessages[transformedMessages.length - 1];
          setConversations(prevConvs => {
            const updated = prevConvs.map(conv =>
              conv.id === activeConversationId
                ? {
                  ...conv,
                  lastMessage: lastMessage.text,
                  time: "Just now",
                  lastMessageAt: lastMessage.date || new Date().toISOString(),
                  // Ensure subject is preserved
                  subject: conv.subject,
                }
                : conv
            );
            return sortConversationsByRecent(updated);
          });
          fetchChats(true);
        }

        // Mark new messages as read
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
  }, [wsMessages, activeConversationId, wsMarkAsRead, fetchChats]);


  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMessageAttachment(file);
    }
    // Reset the input so the same file can be selected again
    if (e.target) {
      e.target.value = '';
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
    setNewMessage(""); // Clear input immediately for better UX
    setMessageAttachment(null); // Clear attachment

    // Stop typing indicator
    wsSendTyping(false);

    try {
      // Optimistic update - add message instantly to chat area
      const optimisticMsg = {
        id: `temp-${Date.now()}`,
        type: "user",
        text: messageText || (attachment ? `📎 ${attachment.name}` : ''),
        date: new Date().toISOString(),
        sender: 'You',
        senderRole: '',
        isRead: false,
        isEdited: false,
        messageType: attachment ? 'file' : 'text',
        isOptimistic: true, // Mark as optimistic
        isUploading: !!attachment, // Add uploading flag
        attachment: attachment ? URL.createObjectURL(attachment) : null,
        attachmentName: attachment?.name || null,
      };

      // Add message instantly to chat area
      setActiveChatMessages(prev => [...prev, optimisticMsg].sort((a, b) => new Date(a.date) - new Date(b.date)));

      // Update conversation list instantly
      const optimisticTimestamp = new Date().toISOString();
      setConversations(prevConvs => {
        const updated = prevConvs.map(conv =>
          conv.id === activeConversationId
            ? {
              ...conv,
              lastMessage: messageText || (attachment ? `📎 ${attachment.name}` : ''),
              time: "Just now",
              lastMessageAt: optimisticTimestamp,
              // Ensure subject is preserved
              subject: conv.subject,
            }
            : conv
        );
        return sortConversationsByRecent(updated);
      });

      // Auto-scroll to bottom instantly
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 50);

      // Try WebSocket first if connected (but WebSocket may not support attachments, so fallback to REST)
      if (wsConnected && !attachment) {
        const sent = wsSendMessage(messageText, false);
        if (sent) {
          console.log('✅ Message sent via WebSocket');
          // Message will come back via WebSocket and replace optimistic message
          setSendingMessage(false); // Reset sending flag
          return;
        }
      }

      // Fallback to REST API (required for attachments)
      console.log('Sending message via REST API');
      const messageData = {
        content: messageText,
        message_type: attachment ? 'file' : 'text',
        is_internal: false
      };

      // Include attachment in messageData if present
      if (attachment) {
        messageData.attachment = attachment;
      }

      const response = await threadsAPI.sendMessage(activeConversationId, messageData);

      if (response.success) {
        console.log('✅ Message sent successfully via REST API');

        // Get current user to ensure message type is correct
        const currentUser = getUserData();
        const currentUserId = currentUser?.id || currentUser?.user_id || currentUser?.userId;
        const senderId = response.data?.sender_id || response.data?.sender?.id || null;

        // Determine message type - sent messages should be "user" (right side)
        let messageType = "user"; // Default for sent messages
        if (senderId && currentUserId) {
          const isSentByCurrentUser = String(senderId) === String(currentUserId) || senderId === currentUserId;
          messageType = isSentByCurrentUser ? "user" : "admin";
        }

        // Parse attachment from response - handle various response formats
        const responseAttachment = response.data?.attachment || null;
        const attachmentUrl = responseAttachment?.url || response.data?.attachment_url || null;
        const attachmentName = responseAttachment?.name || response.data?.attachment_name || attachment?.name || null;
        const attachmentSize = responseAttachment?.size || response.data?.attachment_size || null;
        const attachmentSizeDisplay = attachmentSize
          ? `${(attachmentSize / 1024).toFixed(1)} KB`
          : response.data?.attachment_size_display || null;

        // Replace optimistic message with real message
        const realMsg = {
          id: response.data?.id || Date.now(),
          type: messageType,
          text: messageText || (attachment ? `📎 ${attachment.name}` : ''),
          date: response.data?.created_at || new Date().toISOString(),
          sender: response.data?.sender_name || 'You',
          senderRole: response.data?.sender_role || '',
          isRead: false,
          isEdited: false,
          messageType: attachment ? 'file' : 'text',
          attachment: attachmentUrl,
          attachmentObj: responseAttachment,
          attachmentName: attachmentName,
          attachmentSize: attachmentSizeDisplay,
          hasAttachment: !!(attachment || responseAttachment || attachmentUrl),
        };

        setActiveChatMessages(prev => {
          // Remove optimistic message and add real one
          const filtered = prev.filter(m => m.id !== optimisticMsg.id);
          return [...filtered, realMsg].sort((a, b) => new Date(a.date) - new Date(b.date));
        });

        // If attachment was sent, refresh messages after a delay to get the attachment URL from server
        if (attachment) {
          setTimeout(async () => {
            try {
              const refreshResponse = await chatService.getMessages(activeConversationId);
              if (refreshResponse.success && refreshResponse.data) {
                const messagesArray = Array.isArray(refreshResponse.data.messages)
                  ? refreshResponse.data.messages
                  : (Array.isArray(refreshResponse.data) ? refreshResponse.data : []);

                if (messagesArray.length > 0) {
                  const refreshedMessages = messagesArray.map(msg => {
                    const sender = msg.sender || {};
                    const senderName = sender.name || msg.sender_name || sender.email || 'Unknown';
                    const senderRole = sender.role || msg.sender_role || '';
                    const senderId = sender.id || msg.sender_id || null;

                    const currentUser = getUserData();
                    const currentUserId = currentUser?.id || currentUser?.user_id || currentUser?.userId;
                    const currentUserEmail = currentUser?.email || '';

                    let messageType = "admin";
                    if (senderId && currentUserId) {
                      const isSentByCurrentUser = String(senderId) === String(currentUserId) || senderId === currentUserId;
                      messageType = isSentByCurrentUser ? "user" : "admin";
                    } else if (senderName && currentUserEmail) {
                      const senderEmail = sender.email || senderName;
                      const isSentByCurrentUser = senderEmail.toLowerCase() === currentUserEmail.toLowerCase();
                      messageType = isSentByCurrentUser ? "user" : "admin";
                    } else {
                      const isStaff = senderRole === "staff" || senderRole === "Admin" || senderRole === "Staff" || senderRole === "Accountant" || senderRole === "Bookkeeper" || senderRole === "Assistant";
                      messageType = isStaff ? "admin" : "user";
                    }

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
                      text: msg.content || '',
                      date: msg.created_at,
                      sender: senderName,
                      senderRole: senderRole,
                      isRead: msg.is_read || false,
                      isEdited: msg.is_edited || false,
                      messageType: msg.message_type || 'text',
                      attachment: attachmentUrl,
                      attachmentObj: attachmentObj,
                      attachmentName: attachmentName,
                      attachmentSize: attachmentSizeDisplay,
                      hasAttachment: !!(attachmentObj || attachmentUrl),
                    };
                  });

                  setActiveChatMessages(refreshedMessages);

                  // Auto-scroll to bottom
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
          }, 1000);
        }

        fetchChats(true);
      } else {
        // Remove optimistic message on error
        setActiveChatMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Restore the message and attachment to input on error
      setNewMessage(messageText);
      setMessageAttachment(attachment);
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

      // Handle attachment if present (take the first one)
      if (attachedFiles && attachedFiles.length > 0) {
        payload.document = attachedFiles[0];
      }

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

        const timestamp = thread.last_message_at || thread.created_at || new Date().toISOString();
        // Transform the created thread to match component structure
        const threadId = thread.thread_id || thread.id;
        const newChat = {
          id: threadId,
          name: staffNames,
          lastMessage: lastMessageText,
          time: formatRelativeTime(timestamp),
          lastMessageAt: timestamp,
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

        // Set active conversation first
        setActiveConversationId(newChat.id);

        // Reset form
        setShowModal(false);
        setChatSubject("");
        setChatMessage("");
        setAttachedFiles([]);

        console.log('✅ Thread created successfully:', newChat);

        // Wait a bit for the thread to be fully saved, then refresh conversations list from API
        // This ensures the new conversation shows in Conversations area with subject and message
        setTimeout(() => {
          console.log('Refreshing conversations list from API...');
          fetchChats(false).then(() => {
            console.log('Conversations list refreshed');
            // Ensure the newly created conversation is still active after refresh
            setActiveConversationId(newChat.id);
          }).catch((err) => {
            console.error('Error refreshing conversations:', err);
            // Fallback: Add the new chat manually if API refresh fails
            setConversations(prev => {
              const exists = prev.find(c => c.id === newChat.id);
              if (!exists) {
                return sortConversationsByRecent([newChat, ...prev]);
              }
              return prev;
            });
          });
        }, 500); // Wait 500ms for thread to be fully saved

        // Get current user info for message transformation
        const currentUser = getUserData();
        const currentUserId = currentUser?.id || currentUser?.user_id || currentUser?.userId;
        const currentUserEmail = currentUser?.email || '';

        // Create initial message from thread response if available
        // This ensures the message sent during thread creation is displayed immediately
        const initialMessages = [];
        if (thread.last_message_preview && thread.last_message_preview.content) {
          // Create a message object from the last_message_preview
          const initialMessage = {
            id: thread.last_message_preview.id || `temp-${Date.now()}`,
            type: "user", // Initial message is always from the user who created the thread
            text: thread.last_message_preview.content,
            date: thread.last_message_at || thread.created_at || new Date().toISOString(),
            sender: 'You',
            senderRole: '',
            isRead: false,
            isEdited: false,
            messageType: 'text',
            attachment: null,
            attachmentObj: null,
            attachmentName: null,
            attachmentSize: null,
            hasAttachment: false,
          };
          initialMessages.push(initialMessage);
          console.log('Created initial message from thread response:', initialMessage);
        }

        // Set initial messages immediately so they show up right away
        if (initialMessages.length > 0) {
          setActiveChatMessages(initialMessages);
          console.log('Set initial messages:', initialMessages);
        }

        // Wait a bit for the message to be fully saved, then fetch all messages
        // This ensures we get the complete message list including the initial message
        setTimeout(async () => {
          try {
            setLoadingMessages(true);
            console.log('Fetching messages for newly created thread:', newChat.id);

            // Try new chat-threads API first, fallback to old threads API
            let messagesResponse;
            try {
              messagesResponse = await chatService.getMessages(newChat.id);
            } catch (newApiError) {
              console.log('New chat API failed, trying old API:', newApiError);
              messagesResponse = await threadsAPI.getThreadDetails(newChat.id);
            }

            console.log('Messages response for new thread:', messagesResponse);

            // Handle both new and old API response formats
            let messagesArray = [];
            if (messagesResponse && messagesResponse.success === true && messagesResponse.data) {
              if (Array.isArray(messagesResponse.data.messages)) {
                messagesArray = messagesResponse.data.messages;
              } else if (Array.isArray(messagesResponse.data)) {
                messagesArray = messagesResponse.data;
              } else if (messagesResponse.data.messages) {
                messagesArray = Array.isArray(messagesResponse.data.messages) ? messagesResponse.data.messages : [];
              }
            }

            if (messagesArray.length > 0) {
              // Transform messages to match component structure
              const transformedMessages = messagesArray.map(msg => {
                const sender = msg.sender || {};
                const senderName = sender.name || msg.sender_name || sender.email || 'Unknown';
                const senderRole = sender.role || msg.sender_role || '';
                const senderId = sender.id || msg.sender_id || null;

                // Determine if message is sent by current user (client) or received from staff/admin
                let messageType = "admin";
                if (senderId && currentUserId) {
                  const isSentByCurrentUser = String(senderId) === String(currentUserId) || senderId === currentUserId;
                  messageType = isSentByCurrentUser ? "user" : "admin";
                } else if (senderName && currentUserEmail) {
                  const senderEmail = sender.email || senderName;
                  const isSentByCurrentUser = senderEmail.toLowerCase() === currentUserEmail.toLowerCase();
                  messageType = isSentByCurrentUser ? "user" : "admin";
                } else {
                  const isStaff = senderRole === "staff" || senderRole === "Admin" || senderRole === "Staff" || senderRole === "Accountant" || senderRole === "Bookkeeper" || senderRole === "Assistant";
                  messageType = isStaff ? "admin" : "user";
                }

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
                  text: msg.content || '',
                  date: msg.created_at,
                  sender: senderName,
                  senderRole: senderRole,
                  isRead: msg.is_read || false,
                  isEdited: msg.is_edited || false,
                  messageType: msg.message_type || 'text',
                  attachment: attachmentUrl,
                  attachmentObj: attachmentObj,
                  attachmentName: attachmentName,
                  attachmentSize: attachmentSizeDisplay,
                  hasAttachment: !!(attachmentObj || attachmentUrl),
                };
              });

              console.log('Setting messages for new thread:', transformedMessages);
              setActiveChatMessages(transformedMessages);

              // Auto-scroll to bottom after loading messages
              setTimeout(() => {
                if (messagesEndRef.current) {
                  messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
                }
              }, 100);
            } else if (initialMessages.length > 0) {
              // If API doesn't return messages yet but we have initial message, keep it
              console.log('No messages from API yet, keeping initial message');
            } else {
              // If no messages at all, set empty array
              setActiveChatMessages([]);
            }
          } catch (messagesError) {
            console.error('Error fetching messages for new thread:', messagesError);
            // Keep initial messages if we have them
            if (initialMessages.length === 0) {
              setActiveChatMessages([]);
            }
          } finally {
            setLoadingMessages(false);
          }
        }, 500); // Wait 500ms for message to be saved
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

  const handleDeleteThread = async (threadId, e) => {
    e.stopPropagation(); // Prevent conversation selection
    setThreadToDelete(threadId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteThread = async () => {
    if (!threadToDelete) return;

    try {
      setDeleting(true);

      // Try chatService first, fallback to threadsAPI
      try {
        await chatService.deleteThread(threadToDelete);
      } catch (error) {
        console.log('chatService.deleteThread failed, trying threadsAPI:', error);
        await threadsAPI.deleteThread(threadToDelete);
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
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        icon: false,
        className: "custom-toast-success",
        bodyClassName: "custom-toast-body",
      });
    } catch (err) {
      console.error('Error deleting thread:', err);
      toast.error('Failed to delete thread: ' + (err.message || 'Unknown error'), {
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
      setDeleting(false);
      setShowDeleteConfirm(false);
      setThreadToDelete(null);
    }
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
    <div className="lg:px-4 md:px-2 px-1 messages-page">

      <div className="d-flex justify-content-between align-items-center mb-3 px-2 messages-header">
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

      <div className="d-flex flex-grow-1 overflow-hidden messages-layout">

        <div className="p-3 me-3 d-flex flex-column conversations-panel" style={{ border: "1px solid #E8F0FF", backgroundColor: "#FFFFFF", borderRadius: "12px" }}>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  fontFamily: "BasisGrotesquePro",
                  paddingLeft: "35px",
                }}
              />
            </div>

          </div>
          <div
            className="flex-grow-1 d-flex flex-column mt-3 conversations-scroll"
            style={{
              gap: "12px",
              overflowY: "auto",
              overflowX: "hidden",
              scrollbarWidth: "none",
              msOverflowStyle: "none"
            }}>
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
                  className="btn  btn-outline-primary mt-2"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State - No conversations at all */}
            {!loading && !error && conversations.length === 0 && (
              <div className="text-center py-5">
                <p className="text-muted small mb-0">No conversations yet</p>
                <p className="text-muted small">Start a new message to begin</p>
              </div>
            )}

            {/* Empty State - No search results */}
            {!loading && !error && conversations.length > 0 && filteredConversations.length === 0 && (
              <div className="text-center py-5">
                <p className="text-muted small mb-0">No conversations found</p>
                <p className="text-muted small">Try a different search term</p>
              </div>
            )}

            {/* Conversations List */}
            {!loading && !error && filteredConversations.length > 0 && (
              <div style={{ width: "100%" }}>
                {console.log('🎯 Rendering filtered conversations list, count:', filteredConversations.length)}
                {filteredConversations.map((conv, index) => {
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
                        marginBottom: index < filteredConversations.length - 1 ? "12px" : "0",
                        width: "100%",
                        minHeight: "80px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        position: "relative"
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
                              <span className="badge bg-danger text-white" style={{ fontSize: "10px", color: "#ffffff" }}>
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <small style={{ color: "#3B4A66", fontSize: "12px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>{conv.time}</small>
                          <button
                            onClick={(e) => handleDeleteThread(conv.id, e)}
                            className="btn "
                            style={{
                              background: "transparent",
                              border: "none",
                              padding: "4px 8px",
                              color: "#EF4444",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                            title="Delete thread"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334ZM6.667 7.333v4M9.333 7.333v4" stroke="currentColor" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
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
        <div className="flex-grow-1 bg-white rounded shadow-sm p-3 d-flex flex-column chat-panel">
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

              <div
                ref={messagesContainerRef}
                className="flex-grow-1 mb-3 messages-scroll"
                style={{
                  overflowY: "auto",
                  overflowX: "hidden",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none"
                }}
              >
                <style>
                  {`
                    .messages-scroll::-webkit-scrollbar {
                      display: none;
                      width: 0;
                      height: 0;
                    }
                    .messages-scroll {
                      -ms-overflow-style: none;
                      scrollbar-width: none;
                    }
                    .conversations-scroll::-webkit-scrollbar {
                      display: none;
                      width: 0;
                      height: 0;
                    }
                    .conversations-scroll {
                      -ms-overflow-style: none;
                      scrollbar-width: none;
                    }
                  `}
                </style>
                {console.log('Rendering messages, count:', activeChatMessages.length, 'messages:', activeChatMessages, 'loading:', loadingMessages)}
                {loadingMessages ? (
                  <div className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                    <p className="text-muted mt-2 small">Loading messages...</p>
                  </div>
                ) : activeChatMessages.length > 0 ? (
                  <>
                    {activeChatMessages.map((msg) => {
                      // Admin/Staff messages (received) appear on left
                      if (msg.type === "admin") {
                        return (
                          <React.Fragment key={msg.id}>
                            {msg.text && (
                              <div className={`d-flex w-100 ${msg.hasAttachment ? 'mb-1' : 'mb-3'}`} style={{ fontFamily: "BasisGrotesquePro", justifyContent: "flex-start" }}>
                                <div className="bg-light p-2 px-4 rounded" style={{ marginLeft: "10px", fontFamily: "BasisGrotesquePro", maxWidth: "75%", minWidth: "80px" }}>
                                  <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "4px", fontWeight: "500" }}>
                                    {msg.sender}
                                  </div>
                                  <div style={{ color: msg.type === "user" ? "#FFFFFF" : "inherit" }}>{msg.text}</div>
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
                            )}
                            {msg.hasAttachment && (
                              <div className="d-flex mb-3 w-100" style={{ fontFamily: "BasisGrotesquePro", justifyContent: "flex-start" }}>
                                <div className="bg-light p-2 px-4 rounded" style={{ marginLeft: "10px", fontFamily: "BasisGrotesquePro", maxWidth: "75%", minWidth: "80px" }}>
                                  {!msg.text && (
                                    <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "4px", fontWeight: "500" }}>
                                      {msg.sender}
                                    </div>
                                  )}
                                  <div className={msg.text ? "" : "mt-2"}>
                                    <FileIcon className="me-2 text-primary" />
                                    <a
                                      href={msg.attachment || msg.attachmentObj?.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        fontSize: "12px",
                                        color: "#3B82F6",
                                        textDecoration: "underline",
                                        cursor: "pointer"
                                      }}
                                    >
                                      {msg.attachmentName || "Attachment"}
                                    </a>
                                    {msg.attachmentSize && (
                                      <span style={{ fontSize: "11px", color: "#9CA3AF", marginLeft: "8px" }}>
                                        ({msg.attachmentSize})
                                      </span>
                                    )}
                                  </div>
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
                            )}
                          </React.Fragment>
                        );
                      }
                      // User/Client messages (sent by current user) appear on right
                      else if (msg.type === "user") {
                        return (
                          <React.Fragment key={msg.id}>
                            {msg.text && (
                              <div className={`d-flex w-100 justify-content-end ${msg.hasAttachment ? 'mb-1' : 'mb-3'}`}>
                                <div className="bg-light p-2 px-4 rounded" style={{ fontFamily: "BasisGrotesquePro", marginRight: "16px", maxWidth: "75%", minWidth: "80px", backgroundColor: "#FFF4E6" }}>
                                  <div style={{ color: "#1F2937" }}>{msg.text}</div>
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
                              </div>
                            )}
                            {msg.hasAttachment && (
                              <div className="d-flex mb-3 w-100 justify-content-end">
                                <div className="bg-light p-2 px-4 rounded" style={{ fontFamily: "BasisGrotesquePro", marginRight: "16px", maxWidth: "75%", minWidth: "80px", backgroundColor: "#FFF4E6" }}>
                                  <div className={msg.text ? "" : "mt-2"}>
                                    <FileIcon className="me-2 text-primary" />
                                    {msg.isUploading ? (
                                      <span className="d-inline-flex align-items-center">
                                        <span className="spinner-border spinner-border-sm text-primary me-2" role="status" aria-hidden="true"></span>
                                        <span className="text-muted small" style={{ fontSize: "12px" }}>Uploading {msg.attachmentName}...</span>
                                      </span>
                                    ) : (
                                      <>
                                        <a
                                          href={msg.attachment || msg.attachmentObj?.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{
                                            fontSize: "12px",
                                            color: "#3B82F6",
                                            textDecoration: "underline",
                                            cursor: "pointer"
                                          }}
                                        >
                                          {msg.attachmentName || "Attachment"}
                                        </a>
                                        {msg.attachmentSize && (
                                          <span style={{ fontSize: "11px", color: "#9CA3AF", marginLeft: "8px" }}>
                                            ({msg.attachmentSize})
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </div>
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
                              </div>
                            )}
                          </React.Fragment>
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
                    ref={messageFileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="d-none"
                  />
                  <button
                    type="button"
                    className="btn me-2"
                    onClick={() => messageFileInputRef.current?.click()}
                    style={{
                      background: "transparent",
                      border: "1px solid #E8F0FF",
                      color: "#3B4A66"
                    }}
                    title="Attach file"
                  >
                    <FileIcon />
                  </button>
                  {messageAttachment && (
                    <span className="me-2 text-muted small" style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={messageAttachment.name}>
                      {messageAttachment.name}
                    </span>
                  )}
                  {messageAttachment && (
                    <button
                      type="button"
                      className="btn me-2"
                      onClick={() => setMessageAttachment(null)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#EF4444",
                        padding: "0 5px"
                      }}
                      title="Remove attachment"
                    >
                      ×
                    </button>
                  )}
                  <input
                    type="text"
                    className="form-control me-2"
                    placeholder="Write a message..."
                    value={newMessage}
                    onChange={handleTyping}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !sendingMessage) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    style={{ fontFamily: "BasisGrotesquePro" }}
                  />
                  <button
                    type="button"
                    className="btn"
                    style={{
                      background: (newMessage.trim() || messageAttachment) && !sendingMessage ? "#F56D2D" : "#E5E7EB",
                      color: (newMessage.trim() || messageAttachment) && !sendingMessage ? "#fff" : "#9CA3AF",
                      cursor: (newMessage.trim() || messageAttachment) && !sendingMessage ? "pointer" : "not-allowed"
                    }}
                    onClick={handleSend}
                    disabled={!(newMessage.trim() || messageAttachment) || sendingMessage}
                    aria-label="Send message"
                  >
                    <FaPaperPlane
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: (newMessage.trim() || messageAttachment) ? "pointer" : "not-allowed" }}
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
          )}
        </div>
      </div>

      {/* Popup Modal */}
      {showModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="bg-white p-4 create-chat-modal" style={{ width: "500px", border: "1px solid #E8F0FF", borderRadius: "16px" }}>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
          <div className="bg-white p-4 delete-chat-modal" style={{ width: "400px", border: "1px solid #E8F0FF", borderRadius: "16px" }}>
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
      )}
    </div>
  );
}






