import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { firmAdminMessagingAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken, getUserData } from '../../../ClientOnboarding/utils/userUtils';
import { chatService } from '../../../ClientOnboarding/utils/chatService';
import { useChatWebSocket } from '../../../ClientOnboarding/utils/useChatWebSocket';
import { JdIcon } from '../../../ClientOnboarding/components/icons';
import { toast } from 'react-toastify';
import '../../styles/Message.css';

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const threadIdFromUrl = searchParams.get('threadId');
  const [searchTerm, setSearchTerm] = useState('');
  const [conversationSearch, setConversationSearch] = useState('');
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [messageType, setMessageType] = useState('');
  const [message, setMessage] = useState('');
  const [recipientInput, setRecipientInput] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [attachment, setAttachment] = useState(null);

  // API state
  const [conversations, setConversations] = useState([]);
  const [threadMessages, setThreadMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sendingThreadMessage, setSendingThreadMessage] = useState(false);
  const [threadMessageInput, setThreadMessageInput] = useState('');
  const [threadAttachment, setThreadAttachment] = useState(null);
  const [recipientSearchResults, setRecipientSearchResults] = useState([]);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [messageFilter, setMessageFilter] = useState('all');
  const [staffMembers, setStaffMembers] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [avgResponseTime, setAvgResponseTime] = useState(null);
  const [responseTimeLoading, setResponseTimeLoading] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [activeUsersLoading, setActiveUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserRole, setSelectedUserRole] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const recipientInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const threadFileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const userDropdownRef = useRef(null);

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
  } = useChatWebSocket(selectedThreadId, true);

  // Fetch average response time
  useEffect(() => {
    // console.log('Messages component mounted', { role: getUserData()?.role, threadIdFromUrl });
    const fetchResponseTime = async () => {
      try {
        setResponseTimeLoading(true);
        const token = getAccessToken();
        if (!token) {
          return;
        }

        const API_BASE_URL = getApiBaseUrl();
        const response = await fetchWithCors(`${API_BASE_URL}/firm/my-response-time/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setAvgResponseTime(data.data);
          }
        }
      } catch (err) {
        console.error('Error fetching response time:', err);
        // Don't show error toast, just use default value
      } finally {
        setResponseTimeLoading(false);
      }
    };

    fetchResponseTime();
  }, []);

  // Fetch conversations - extracted to be reusable
  const fetchConversations = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError('');

      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (messageFilter !== 'all') {
        params.type = messageFilter === 'client' ? 'client' : 'staff';
      }

      // Try new chat-threads API first, fallback to old firm admin API
      let response;
      try {
        response = await chatService.getThreads();
        // Transform new API response to match expected format
        if (response.success && response.data) {
          const threadsArray = Array.isArray(response.data) ? response.data : [];
          setConversations(threadsArray.map(thread => ({
            id: thread.thread_id || thread.id, // Prefer thread_id from newer system or associated thread
            legacy_id: thread.id, // Keep original ID for reference if needed
            subject: thread.subject,
            client_name: thread.client?.name || thread.client_name || null,
            client_email: thread.client?.email || thread.client_email || null,
            client: thread.client || null,
            assigned_staff: thread.assigned_staff || [],
            assigned_staff_names: thread.assigned_staff?.map(s => s.name) || [],
            unread_count: thread.unread_count || 0,
            last_message_at: thread.last_message?.created_at || thread.updated_at || thread.created_at,
            last_message_preview: thread.last_message || null,
            is_staff_conversation: !thread.client,
            created_at: thread.created_at,
            updated_at: thread.updated_at,
          })));
          return;
        }
      } catch (newApiError) {
        console.log('New chat API failed, trying old API:', newApiError);
      }

      if (response.success && response.data) {
        const conversationsArray = response.data.conversations || [];
        setConversations(conversationsArray.map(conv => ({
          ...conv,
          id: conv.thread_id || conv.id, // Prefer thread_id for modern components
          legacy_id: conv.id
        })));
      } else {
        throw new Error(response.message || 'Failed to load conversations');
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to load conversations');
      if (showLoading) {
        toast.error(errorMsg || 'Failed to load conversations');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [searchTerm, messageFilter]);

  // Fetch conversations on mount and when filters change
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle thread selection from URL
  useEffect(() => {
    if (threadIdFromUrl && conversations.length > 0) {
      const threadId = Number(threadIdFromUrl);
      if (selectedThreadId !== threadId) {
        const conv = conversations.find(c => c.id === threadId);
        if (conv) {
          setSelectedConversation(conv);
          setSelectedThreadId(threadId);
        }
      }
    }
  }, [threadIdFromUrl, conversations, selectedThreadId]);

  // Fetch thread messages when conversation is selected
  useEffect(() => {
    const fetchThreadMessages = async () => {
      if (!selectedThreadId) {
        setThreadMessages([]);
        return;
      }

      try {
        setMessagesLoading(true);

        // Use the getMessages API function
        let response;
        try {
          // Try firmAdminMessagingAPI.getMessages first
          response = await firmAdminMessagingAPI.getMessages(selectedThreadId, { page: 1, page_size: 50 });
          console.log('getMessages response for thread', selectedThreadId, ':', response);

          // Handle various response formats
          let messagesArray = [];

          // Check if response has success property
          if (response && typeof response === 'object') {
            // Format: { success: true, data: { messages: [...] } }
            if (response.success && response.data) {
              if (Array.isArray(response.data.messages)) {
                messagesArray = response.data.messages;
              } else if (Array.isArray(response.data)) {
                messagesArray = response.data;
              } else if (response.data.results && Array.isArray(response.data.results)) {
                messagesArray = response.data.results;
              }
            }
            // Format: { data: { messages: [...] } }
            else if (response.data) {
              if (Array.isArray(response.data.messages)) {
                messagesArray = response.data.messages;
              } else if (Array.isArray(response.data)) {
                messagesArray = response.data;
              } else if (response.data.results && Array.isArray(response.data.results)) {
                messagesArray = response.data.results;
              }
            }
            // Format: { messages: [...] }
            else if (Array.isArray(response.messages)) {
              messagesArray = response.messages;
            }
            // Format: direct array
            else if (Array.isArray(response)) {
              messagesArray = response;
            }
          }

          console.log('Extracted messages array length:', messagesArray.length);

          if (messagesArray.length > 0) {
            const transformedMessages = messagesArray.map(msg => {
              // Handle attachment object from API
              const attachmentObj = msg.attachment || null;
              const attachmentUrl = attachmentObj?.url || null;
              const attachmentName = attachmentObj?.name || msg.attachment_name || null;

              return {
                id: msg.id,
                content: msg.content || msg.message || '',
                sender_name: msg.sender?.name || msg.sender_name || 'Unknown',
                sender_role: msg.sender?.role || msg.sender_role || '',
                sender_id: msg.sender?.id || msg.sender_id || null,
                created_at: msg.created_at,
                is_read: msg.is_read || false,
                attachment: attachmentUrl, // Keep URL for backward compatibility
                attachmentObj: attachmentObj, // Store full attachment object
                attachment_name: attachmentName,
                hasAttachment: !!(attachmentObj || attachmentUrl),
              };
            });
            console.log('Setting threadMessages with', transformedMessages.length, 'messages');
            setThreadMessages(transformedMessages);
            return;
          } else {
            console.log('No messages found in response, trying chatService fallback');
          }
        } catch (apiError) {
          console.error('firmAdminMessagingAPI.getMessages failed:', apiError);

          // Fallback to chatService
          try {
            response = await chatService.getMessages(selectedThreadId);
            console.log('chatService.getMessages response:', response);

            if (response.success && response.data) {
              const messagesArray = Array.isArray(response.data.messages)
                ? response.data.messages
                : (Array.isArray(response.data) ? response.data : []);

              if (messagesArray.length > 0) {
                setThreadMessages(messagesArray.map(msg => {
                  // Handle attachment object from API
                  const attachmentObj = msg.attachment || null;
                  const attachmentUrl = attachmentObj?.url || null;
                  const attachmentName = attachmentObj?.name || msg.attachment_name || null;

                  return {
                    id: msg.id,
                    content: msg.content || msg.message,
                    sender_name: msg.sender?.name || msg.sender_name || 'Unknown',
                    sender_role: msg.sender?.role || msg.sender_role || '',
                    sender_id: msg.sender?.id || msg.sender_id || null,
                    created_at: msg.created_at,
                    is_read: msg.is_read || false,
                    attachment: attachmentUrl, // Keep URL for backward compatibility
                    attachmentObj: attachmentObj, // Store full attachment object
                    attachment_name: attachmentName,
                    hasAttachment: !!(attachmentObj || attachmentUrl),
                  };
                }));
                return;
              }
            }
          } catch (chatServiceError) {
            console.log('chatService.getMessages also failed:', chatServiceError);
          }
        }

        // If no messages found, set empty array
        setThreadMessages([]);
      } catch (err) {
        console.error('Error fetching thread messages:', err);
        const errorMsg = handleAPIError(err);
        toast.error(errorMsg || 'Failed to load messages');
        setThreadMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchThreadMessages();
  }, [selectedThreadId]);

  // Sync WebSocket messages with local state - prevent duplicates
  useEffect(() => {
    if (wsMessages && wsMessages.length > 0 && selectedThreadId) {
      const relevantMessages = wsMessages.filter(msg => {
        return (!msg.thread_id || msg.thread_id === selectedThreadId) && msg.id;
      });

      if (relevantMessages.length > 0) {
        const transformedMessages = relevantMessages.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender_name: msg.sender?.name || msg.sender_name,
          sender_role: msg.sender?.role || msg.sender_role,
          sender_id: msg.sender?.id || msg.sender_id || null,
          created_at: msg.created_at,
          is_read: msg.is_read || false,
          attachment: msg.attachment || null,
          attachment_name: msg.attachment_name || null,
        }));

        setThreadMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMessages = transformedMessages.filter(m => m.id && !existingIds.has(m.id));

          if (newMessages.length > 0) {
            // Merge and sort by created_at
            const merged = [...prev, ...newMessages];
            const unique = merged.filter((msg, index, self) =>
              index === self.findIndex(m => m.id === msg.id)
            );
            return unique.sort((a, b) =>
              new Date(a.created_at) - new Date(b.created_at)
            );
          }
          return prev;
        });

        // Mark new messages as read
        transformedMessages.forEach(msg => {
          if (msg.id && !msg.is_read) {
            wsMarkAsRead(msg.id);
          }
        });
      }
    }
  }, [wsMessages, selectedThreadId, wsMarkAsRead]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      // Check if user is near the bottom (within 100px) or at the bottom
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

      // Always scroll to bottom when new messages arrive if user is near bottom or when sending
      if (isNearBottom || threadMessages.length > 0) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
      }
    }
  }, [threadMessages.length, selectedThreadId]);

  // Scroll to bottom when thread is selected
  useEffect(() => {
    if (selectedThreadId && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 300);
    }
  }, [selectedThreadId]);

  // Fetch staff members (kept for backward compatibility)
  const fetchStaffMembers = async () => {
    try {
      setStaffLoading(true);
      const token = getAccessToken();
      const API_BASE_URL = getApiBaseUrl();

      const response = await fetchWithCors(`${API_BASE_URL}/firm/staff/list/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data && result.data.staff_members) {
        setStaffMembers(result.data.staff_members || []);
      } else {
        setStaffMembers([]);
      }
    } catch (err) {
      console.error('Error fetching staff members:', err);
      setStaffMembers([]);
    } finally {
      setStaffLoading(false);
    }
  };

  // Fetch active users using new API
  const fetchActiveUsers = async (search = '', role = '') => {
    try {
      setActiveUsersLoading(true);
      const params = {
        exclude_existing_chats: true // Only show users we don't have a chat with
      };
      if (search) params.search = search;
      if (role) params.role = role;

      const response = await firmAdminMessagingAPI.getActiveUsers(params);

      if (response.success && response.data && response.data.users) {
        let users = response.data.users || [];

        // Filter out users who already have a conversation
        if (conversations && conversations.length > 0) {
          const existingThreadUserIds = new Set();

          conversations.forEach(conv => {
            // Check for client in conversation
            if (conv.client && conv.client.id) {
              existingThreadUserIds.add(conv.client.id);
            }
            // Check for staff in conversation
            if (conv.assigned_staff && Array.isArray(conv.assigned_staff)) {
              conv.assigned_staff.forEach(staff => {
                if (staff && staff.id) existingThreadUserIds.add(staff.id);
              });
            }
          });

          users = users.filter(user => !existingThreadUserIds.has(user.id));
        }

        setActiveUsers(users);
      } else {
        setActiveUsers([]);
      }
    } catch (err) {
      console.error('Error fetching active users:', err);
      setActiveUsers([]);
    } finally {
      setActiveUsersLoading(false);
    }
  };

  // Fetch active users when compose modal opens
  useEffect(() => {
    if (isComposeModalOpen) {
      fetchActiveUsers();
      // Reset selection when modal opens
      setSelectedStaffId('');
      setSelectedUserId('');
      setUserSearchQuery('');
      setUserRoleFilter('');
      setShowUserDropdown(false);
    }
  }, [isComposeModalOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  // Debounced search for active users
  useEffect(() => {
    if (!isComposeModalOpen) return;

    const timeoutId = setTimeout(() => {
      fetchActiveUsers(userSearchQuery, userRoleFilter);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userSearchQuery, userRoleFilter, isComposeModalOpen]);

  // Search recipients (kept for backward compatibility if needed)
  const searchRecipients = async (query) => {
    if (!query || query.trim().length < 2) {
      setRecipientSearchResults([]);
      setShowRecipientDropdown(false);
      return;
    }

    try {
      const response = await firmAdminMessagingAPI.searchRecipients({ q: query, type: 'staff' });

      if (response.success && response.data) {
        setRecipientSearchResults(response.data.recipients || []);
        setShowRecipientDropdown(true);
      }
    } catch (err) {
      console.error('Error searching recipients:', err);
      setRecipientSearchResults([]);
    }
  };

  // Handle recipient input change
  useEffect(() => {
    if (recipientInput.trim()) {
      const timeoutId = setTimeout(() => {
        searchRecipients(recipientInput);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setRecipientSearchResults([]);
      setShowRecipientDropdown(false);
    }
  }, [recipientInput]);

  // Handle staff selection
  const handleStaffChange = (staffId) => {
    setSelectedStaffId(staffId);
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    setSelectedThreadId(conversation.id);
  };

  // Handle compose message
  const handleComposeMessage = async () => {
    const userId = selectedUserId || selectedStaffId;
    if (!userId) {
      toast.error('Please select a user');
      return;
    }

    try {
      setSending(true);

      const targetUserId = Number(userId);

      // Determine chat type based on selected user's role
      const preparer_roles = ['staff', 'accountant', 'bookkeeper', 'assistant', 'tax_preparer', 'admin', 'firm'];
      const isStaff = preparer_roles.includes(selectedUserRole?.toLowerCase());
      const chatType = isStaff ? 'firm_tax_preparer' : 'tax_preparer_client';
      const category = isStaff ? 'Staff' : 'Client';

      // Use unified chatService to create chat with opening message and metadata
      const response = await chatService.createTaxPreparerChat(targetUserId, {
        chat_type: chatType,
        opening_message: message.trim(),
        subject: '', // Can be added to form later if needed
        category: category,
        priority: 'Medium'
      });

      if (response.success && response.data) {
        toast.success('Message sent successfully');
        setIsComposeModalOpen(false);
        const newThreadId = response.data.thread_id || response.data.id;
        setSelectedThreadId(newThreadId);
        // Reset form
        setMessage('');
        setSelectedStaffId('');
        setSelectedUserId('');
        setSelectedUserRole('');
        setUserSearchQuery('');
        setUserRoleFilter('');
        setRecipientInput('');
        setAttachment(null);
        setShowUserDropdown(false);
        // Refresh conversations using consistent API (without loading state)
        fetchConversations(false);
      } else {
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle user selection
  const handleUserSelect = (user) => {
    setSelectedUserId(user.id);
    setSelectedUserRole(user.role || '');
    setUserSearchQuery(user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.email);
    setShowUserDropdown(false);
  };

  // Add recipient
  const addRecipient = (recipient) => {
    if (recipient === '@everyone') {
      // If @everyone is selected, replace all recipients with just @everyone
      setRecipients(['@everyone']);
    } else {
      // Handle recipient object from search or string
      let recipientToAdd;
      if (typeof recipient === 'string') {
        recipientToAdd = recipient;
      } else if (recipient && typeof recipient === 'object') {
        // Use display_name or construct from username
        recipientToAdd = recipient.display_name || `@${recipient.username}`;
      } else {
        recipientToAdd = recipient;
      }

      // Check if already added
      const isAlreadyAdded = recipients.some(r => {
        if (typeof r === 'string' && typeof recipientToAdd === 'string') {
          return r === recipientToAdd;
        }
        if (typeof r === 'object' && typeof recipient === 'object') {
          return r.id === recipient.id;
        }
        return false;
      });

      if (!isAlreadyAdded) {
        // If @everyone is in recipients, remove it first
        const filteredRecipients = recipients.filter(r => r !== '@everyone');
        setRecipients([...filteredRecipients, recipientToAdd]);
      }
    }
    setRecipientInput('');
    setShowRecipientDropdown(false);
    setRecipientSearchResults([]);
  };

  // Handle file attachment
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
    }
  };

  // Handle thread file attachment
  const handleThreadFileSelect = (e) => {
    const file = e.target.files[0];
    console.log('File selected for thread:', file ? file.name : 'none');
    if (file) {
      setThreadAttachment(file);
      // Clear value so the same file can be selected again
      e.target.value = '';
    }
  };

  // Handle sending message in thread
  const handleSendThreadMessage = async () => {
    // Prevent double-sending
    if (sendingThreadMessage) {
      console.log('⚠️ Message send already in progress, ignoring duplicate call');
      return;
    }

    if (!selectedThreadId || (!threadMessageInput.trim() && !threadAttachment)) {
      return;
    }

    const messageText = threadMessageInput.trim();
    setThreadMessageInput(''); // Clear input immediately

    try {
      setSendingThreadMessage(true);

      // Skip WebSocket if attachment is present - WebSocket doesn't support file attachments
      // Try WebSocket first only if no attachment and WebSocket is connected
      if (wsConnected && !threadAttachment) {
        console.log('Attempting to send message via WebSocket...', { messageText });
        const sent = await wsSendMessage(messageText, false);
        if (sent) {
          console.log('✅ Message sent via WebSocket');
          toast.success('Message sent successfully');
          // Message will come back via WebSocket, no need to refresh manually
          // Only refresh conversations to update last message timestamp (without loading state)
          fetchConversations(false);
          // Scroll to bottom after sending
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }, 100);
          setSendingThreadMessage(false);
          return;
        } else {
          console.log('WebSocket send failed, falling back to REST API');
        }
      }

      // Use REST API for attachments or if WebSocket failed/not connected
      const messageData = {
        content: messageText.trim(),
        is_internal: false
      };

      const response = await firmAdminMessagingAPI.sendMessage(selectedThreadId, messageData, threadAttachment);

      if (response.success) {
        toast.success('Message sent successfully');

        // Save attachment state before clearing it
        const hadAttachment = !!threadAttachment;
        setThreadAttachment(null);

        // Always refresh messages after sending attachment to get the attachment URL
        // WebSocket might not properly handle attachment URLs or might delay
        if (hadAttachment) {
          // Wait a moment for server to process the attachment, then refresh
          setTimeout(async () => {
            try {
              const messagesResponse = await firmAdminMessagingAPI.getMessages(selectedThreadId, { page: 1, page_size: 50 });
              console.log('Refreshed messages after attachment send:', messagesResponse);

              let messagesArray = [];
              if (messagesResponse.success && messagesResponse.data) {
                if (Array.isArray(messagesResponse.data.messages)) {
                  messagesArray = messagesResponse.data.messages;
                } else if (Array.isArray(messagesResponse.data)) {
                  messagesArray = messagesResponse.data;
                } else if (messagesResponse.data.results) {
                  messagesArray = messagesResponse.data.results;
                }
              } else if (Array.isArray(messagesResponse)) {
                messagesArray = messagesResponse;
              }

              if (messagesArray.length > 0) {
                setThreadMessages(messagesArray.map(msg => {
                  // Handle attachment object from API
                  const attachmentObj = msg.attachment || null;
                  const attachmentUrl = attachmentObj?.url || msg.attachment_url || null;
                  const attachmentName = attachmentObj?.name || msg.attachment_name || null;

                  return {
                    id: msg.id,
                    content: msg.content || msg.message || '',
                    sender_name: msg.sender?.name || msg.sender_name || 'Unknown',
                    sender_role: msg.sender?.role || msg.sender_role || '',
                    sender_id: msg.sender?.id || msg.sender_id || null,
                    created_at: msg.created_at,
                    is_read: msg.is_read || false,
                    attachment: attachmentUrl,
                    attachmentObj: attachmentObj,
                    attachment_name: attachmentName,
                    hasAttachment: !!(attachmentObj || attachmentUrl),
                  };
                }));

                // Scroll to bottom
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }, 100);
              }
            } catch (refreshError) {
              console.error('Error refreshing messages after attachment send:', refreshError);
            }
          }, 1000);
        }

        // Refresh messages if WebSocket is not connected
        if (!wsConnected) {
          // Scroll to bottom after sending
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }, 200);
          try {
            const messagesResponse = await firmAdminMessagingAPI.getMessages(selectedThreadId, { page: 1, page_size: 50 });
            console.log('Refreshed messages after send (REST fallback):', messagesResponse);

            let messagesArray = [];
            if (messagesResponse.success && messagesResponse.data) {
              if (Array.isArray(messagesResponse.data.messages)) {
                messagesArray = messagesResponse.data.messages;
              } else if (Array.isArray(messagesResponse.data)) {
                messagesArray = messagesResponse.data;
              } else if (messagesResponse.data.results) {
                messagesArray = messagesResponse.data.results;
              }
            } else if (Array.isArray(messagesResponse)) {
              messagesArray = messagesResponse;
            }

            if (messagesArray.length > 0) {
              setThreadMessages(messagesArray.map(msg => {
                // Handle attachment object from API
                const attachmentObj = msg.attachment || null;
                const attachmentUrl = attachmentObj?.url || msg.attachment_url || null;
                const attachmentName = attachmentObj?.name || msg.attachment_name || null;

                return {
                  id: msg.id,
                  content: msg.content || msg.message || '',
                  sender_name: msg.sender?.name || msg.sender_name || 'Unknown',
                  sender_role: msg.sender?.role || msg.sender_role || '',
                  sender_id: msg.sender?.id || msg.sender_id || null,
                  created_at: msg.created_at,
                  is_read: msg.is_read || false,
                  attachment: attachmentUrl,
                  attachmentObj: attachmentObj,
                  attachment_name: attachmentName,
                  hasAttachment: !!(attachmentObj || attachmentUrl),
                };
              }));
            }
          } catch (refreshError) {
            console.error('Error refreshing messages after send:', refreshError);
            // Try chatService as fallback
            try {
              const chatResponse = await chatService.getMessages(selectedThreadId);
              if (chatResponse.success && chatResponse.data) {
                const messagesArray = Array.isArray(chatResponse.data.messages)
                  ? chatResponse.data.messages
                  : (Array.isArray(chatResponse.data) ? chatResponse.data : []);
                if (messagesArray.length > 0) {
                  setThreadMessages(messagesArray.map(msg => {
                    // Handle attachment object from API
                    const attachmentObj = msg.attachment || null;
                    const attachmentUrl = attachmentObj?.url || msg.attachment_url || null;
                    const attachmentName = attachmentObj?.name || msg.attachment_name || null;

                    return {
                      id: msg.id,
                      content: msg.content || msg.message || '',
                      sender_name: msg.sender?.name || msg.sender_name || 'Unknown',
                      sender_role: msg.sender?.role || msg.sender_role || '',
                      sender_id: msg.sender?.id || msg.sender_id || null,
                      created_at: msg.created_at,
                      is_read: msg.is_read || false,
                      attachment: attachmentUrl,
                      attachmentObj: attachmentObj,
                      attachment_name: attachmentName,
                      hasAttachment: !!(attachmentObj || attachmentUrl),
                    };
                  }));
                }
              }
            } catch (fallbackError) {
              console.error('Fallback refresh also failed:', fallbackError);
            }
          }
        }

        // Refresh conversations to update last message (use same API as initial fetch, without loading state)
        fetchConversations(false);
      } else {
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending thread message:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to send message');
      // Restore message on error
      setThreadMessageInput(messageText);
    } finally {
      setSendingThreadMessage(false);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get first character from name
  const getFirstChar = (name) => {
    if (!name) return '?';
    const trimmed = name.trim();
    if (trimmed.length === 0) return '?';
    return trimmed[0].toUpperCase();
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

      // Try chatService first, fallback to firmAdminMessagingAPI
      try {
        await chatService.deleteThread(threadToDelete);
      } catch (error) {
        console.log('chatService.deleteThread failed, trying alternative method:', error);
        // Use chatService as primary method since it's standardized
        throw error;
      }

      // Remove from conversations list
      setConversations(prev => prev.filter(conv => conv.id !== threadToDelete));

      // If deleted conversation was active, clear it
      if (selectedThreadId === threadToDelete) {
        setSelectedThreadId(null);
        setSelectedConversation(null);
        setThreadMessages([]);
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

  // Summary cards data
  const summaryCards = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.75 10.4999C15.75 10.6988 15.671 10.8896 15.5303 11.0302C15.3897 11.1709 15.1989 11.2499 15 11.2499H9C8.80109 11.2499 8.61032 11.1709 8.46967 11.0302C8.32902 10.8896 8.25 10.6988 8.25 10.4999C8.25 10.301 8.32902 10.1102 8.46967 9.96958C8.61032 9.82893 8.80109 9.74991 9 9.74991H15C15.1989 9.74991 15.3897 9.82893 15.5303 9.96958C15.671 10.1102 15.75 10.301 15.75 10.4999ZM15 12.7499H9C8.80109 12.7499 8.61032 12.8289 8.46967 12.9696C8.32902 13.1102 8.25 13.301 8.25 13.4999C8.25 13.6988 8.32902 13.8896 8.46967 14.0302C8.61032 14.1709 8.80109 14.2499 9 14.2499H15C15.1989 14.2499 15.3897 14.1709 15.5303 14.0302C15.671 13.8896 15.75 13.6988 15.75 13.4999C15.75 13.301 15.671 13.1102 15.5303 12.9696C15.3897 12.8289 15.1989 12.7499 15 12.7499ZM21.75 11.9999C21.7504 13.6832 21.3149 15.338 20.486 16.803C19.6572 18.2681 18.4631 19.4937 17.02 20.3604C15.577 21.2271 13.9341 21.7054 12.2514 21.7488C10.5686 21.7922 8.9033 21.3992 7.4175 20.608L4.22531 21.6721C3.96102 21.7602 3.6774 21.773 3.40624 21.709C3.13509 21.645 2.88711 21.5068 2.69011 21.3098C2.49311 21.1128 2.35486 20.8648 2.29087 20.5937C2.22688 20.3225 2.23967 20.0389 2.32781 19.7746L3.39187 16.5824C2.69639 15.2748 2.30793 13.826 2.256 12.3458C2.20406 10.8657 2.49001 9.39316 3.09213 8.04003C3.69425 6.6869 4.59672 5.48873 5.73105 4.53646C6.86537 3.58419 8.20173 2.90285 9.63869 2.54416C11.0756 2.18548 12.5754 2.15886 14.0242 2.46635C15.473 2.77383 16.8327 3.40733 18.0001 4.31875C19.1675 5.23018 20.1119 6.39558 20.7616 7.7265C21.4114 9.05741 21.7494 10.5189 21.75 11.9999ZM20.25 11.9999C20.2496 10.7344 19.9582 9.48593 19.3981 8.3511C18.838 7.21627 18.0244 6.2255 17.0201 5.45544C16.0159 4.68537 14.8479 4.15666 13.6067 3.91021C12.3654 3.66375 11.084 3.70616 9.86178 4.03415C8.63951 4.36215 7.50909 4.96693 6.55796 5.80171C5.60682 6.6365 4.86049 7.6789 4.37668 8.84828C3.89288 10.0177 3.68458 11.2827 3.7679 12.5454C3.85122 13.8082 4.22393 15.0349 4.85719 16.1305C4.91034 16.2225 4.94334 16.3247 4.954 16.4304C4.96467 16.5361 4.95276 16.6429 4.91906 16.7437L3.75 20.2499L7.25625 19.0808C7.33262 19.0548 7.41275 19.0415 7.49344 19.0415C7.62516 19.0417 7.7545 19.0766 7.86844 19.1427C9.12263 19.8684 10.5458 20.2509 11.9948 20.2518C13.4438 20.2527 14.8674 19.872 16.1225 19.1479C17.3776 18.4239 18.4199 17.382 19.1445 16.1272C19.869 14.8724 20.2503 13.4489 20.25 11.9999Z" fill="#3AD6F2" />
        </svg>

      ),
      value: '3',
      label: 'Unread Message'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M9 1.25C7.74022 1.25 6.53204 1.75044 5.64124 2.64124C4.75045 3.53204 4.25 4.74022 4.25 6C4.25 7.25978 4.75045 8.46796 5.64124 9.35876C6.53204 10.2496 7.74022 10.75 9 10.75C10.2598 10.75 11.468 10.2496 12.3588 9.35876C13.2496 8.46796 13.75 7.25978 13.75 6C13.75 4.74022 13.2496 3.53204 12.3588 2.64124C11.468 1.75044 10.2598 1.25 9 1.25ZM5.75 6C5.75 5.13805 6.09241 4.3114 6.7019 3.7019C7.3114 3.09241 8.13805 2.75 9 2.75C9.86195 2.75 10.6886 3.09241 11.2981 3.7019C11.9076 4.3114 12.25 5.13805 12.25 6C12.25 6.86195 11.9076 7.6886 11.2981 8.2981C10.6886 8.90759 9.86195 9.25 9 9.25C8.13805 9.25 7.3114 8.90759 6.7019 8.2981C6.09241 7.6886 5.75 6.86195 5.75 6Z" fill="#3AD6F2" />
          <path d="M15 2.25C14.8011 2.25 14.6103 2.32902 14.4697 2.46967C14.329 2.61032 14.25 2.80109 14.25 3C14.25 3.19891 14.329 3.38968 14.4697 3.53033C14.6103 3.67098 14.8011 3.75 15 3.75C15.5967 3.75 16.169 3.98705 16.591 4.40901C17.0129 4.83097 17.25 5.40326 17.25 6C17.25 6.59674 17.0129 7.16903 16.591 7.59099C16.169 8.01295 15.5967 8.25 15 8.25C14.8011 8.25 14.6103 8.32902 14.4697 8.46967C14.329 8.61032 14.25 8.80109 14.25 9C14.25 9.19891 14.329 9.38968 14.4697 9.53033C14.6103 9.67098 14.8011 9.75 15 9.75C15.9946 9.75 16.9484 9.35491 17.6517 8.65165C18.3549 7.94839 18.75 6.99456 18.75 6C18.75 5.00544 18.3549 4.05161 17.6517 3.34835C16.9484 2.64509 15.9946 2.25 15 2.25Z" fill="#3AD6F2" />
          <path fill-rule="evenodd" clip-rule="evenodd" d="M3.678 13.52C5.078 12.72 6.961 12.25 9 12.25C11.039 12.25 12.922 12.72 14.322 13.52C15.7 14.308 16.75 15.51 16.75 17C16.75 18.49 15.7 19.692 14.322 20.48C12.922 21.28 11.039 21.75 9 21.75C6.961 21.75 5.078 21.28 3.678 20.48C2.3 19.692 1.25 18.49 1.25 17C1.25 15.51 2.3 14.308 3.678 13.52ZM4.422 14.823C3.267 15.483 2.75 16.28 2.75 17C2.75 17.72 3.267 18.517 4.422 19.177C5.556 19.825 7.173 20.25 9 20.25C10.827 20.25 12.444 19.825 13.578 19.177C14.733 18.517 15.25 17.719 15.25 17C15.25 16.281 14.733 15.483 13.578 14.823C12.444 14.175 10.827 13.75 9 13.75C7.173 13.75 5.556 14.175 4.422 14.823Z" fill="#3AD6F2" />
          <path d="M18.1598 13.2673C17.9654 13.2248 17.7621 13.2614 17.5946 13.3688C17.4271 13.4763 17.3092 13.6459 17.2668 13.8403C17.2243 14.0347 17.2609 14.238 17.3683 14.4054C17.4758 14.5729 17.6454 14.6908 17.8398 14.7333C18.6318 14.9063 19.2648 15.2053 19.6828 15.5473C20.1008 15.8893 20.2498 16.2243 20.2498 16.5003C20.2498 16.7503 20.1298 17.0453 19.7968 17.3543C19.4618 17.6653 18.9468 17.9523 18.2838 18.1523C18.1894 18.1806 18.1016 18.2273 18.0253 18.2896C17.9489 18.3519 17.8856 18.4287 17.839 18.5154C17.7923 18.6022 17.7632 18.6973 17.7533 18.7954C17.7434 18.8934 17.7529 18.9924 17.7813 19.0868C17.8096 19.1811 17.8563 19.269 17.9186 19.3453C17.9809 19.4216 18.0577 19.4849 18.1445 19.5316C18.2312 19.5782 18.3263 19.6073 18.4244 19.6172C18.5224 19.6271 18.6214 19.6176 18.7158 19.5893C19.5388 19.3413 20.2738 18.9583 20.8178 18.4533C21.3638 17.9463 21.7498 17.2793 21.7498 16.5003C21.7498 15.6353 21.2758 14.9123 20.6328 14.3863C19.9888 13.8593 19.1218 13.4783 18.1598 13.2673Z" fill="#3AD6F2" />
        </svg>

      ),
      value: '2',
      label: 'Client Conversations'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.75 10.4999C15.75 10.6988 15.671 10.8896 15.5303 11.0302C15.3897 11.1709 15.1989 11.2499 15 11.2499H9C8.80109 11.2499 8.61032 11.1709 8.46967 11.0302C8.32902 10.8896 8.25 10.6988 8.25 10.4999C8.25 10.301 8.32902 10.1102 8.46967 9.96958C8.61032 9.82893 8.80109 9.74991 9 9.74991H15C15.1989 9.74991 15.3897 9.82893 15.5303 9.96958C15.671 10.1102 15.75 10.301 15.75 10.4999ZM15 12.7499H9C8.80109 12.7499 8.61032 12.8289 8.46967 12.9696C8.32902 13.1102 8.25 13.301 8.25 13.4999C8.25 13.6988 8.32902 13.8896 8.46967 14.0302C8.61032 14.1709 8.80109 14.2499 9 14.2499H15C15.1989 14.2499 15.3897 14.1709 15.5303 14.0302C15.671 13.8896 15.75 13.6988 15.75 13.4999C15.75 13.301 15.671 13.1102 15.5303 12.9696C15.3897 12.8289 15.1989 12.7499 15 12.7499ZM21.75 11.9999C21.7504 13.6832 21.3149 15.338 20.486 16.803C19.6572 18.2681 18.4631 19.4937 17.02 20.3604C15.577 21.2271 13.9341 21.7054 12.2514 21.7488C10.5686 21.7922 8.9033 21.3992 7.4175 20.608L4.22531 21.6721C3.96102 21.7602 3.6774 21.773 3.40624 21.709C3.13509 21.645 2.88711 21.5068 2.69011 21.3098C2.49311 21.1128 2.35486 20.8648 2.29087 20.5937C2.22688 20.3225 2.23967 20.0389 2.32781 19.7746L3.39187 16.5824C2.69639 15.2748 2.30793 13.826 2.256 12.3458C2.20406 10.8657 2.49001 9.39316 3.09213 8.04003C3.69425 6.6869 4.59672 5.48873 5.73105 4.53646C6.86537 3.58419 8.20173 2.90285 9.63869 2.54416C11.0756 2.18548 12.5754 2.15886 14.0242 2.46635C15.473 2.77383 16.8327 3.40733 18.0001 4.31875C19.1675 5.23018 20.1119 6.39558 20.7616 7.7265C21.4114 9.05741 21.7494 10.5189 21.75 11.9999ZM20.25 11.9999C20.2496 10.7344 19.9582 9.48593 19.3981 8.3511C18.838 7.21627 18.0244 6.2255 17.0201 5.45544C16.0159 4.68537 14.8479 4.15666 13.6067 3.91021C12.3654 3.66375 11.084 3.70616 9.86178 4.03415C8.63951 4.36215 7.50909 4.96693 6.55796 5.80171C5.60682 6.6365 4.86049 7.6789 4.37668 8.84828C3.89288 10.0177 3.68458 11.2827 3.7679 12.5454C3.85122 13.8082 4.22393 15.0349 4.85719 16.1305C4.91034 16.2225 4.94334 16.3247 4.954 16.4304C4.96467 16.5361 4.95276 16.6429 4.91906 16.7437L3.75 20.2499L7.25625 19.0808C7.33262 19.0548 7.41275 19.0415 7.49344 19.0415C7.62516 19.0417 7.7545 19.0766 7.86844 19.1427C9.12263 19.8684 10.5458 20.2509 11.9948 20.2518C13.4438 20.2527 14.8674 19.872 16.1225 19.1479C17.3776 18.4239 18.4199 17.382 19.1445 16.1272C19.869 14.8724 20.2503 13.4489 20.25 11.9999Z" fill="#3AD6F2" />
        </svg>
      ),
      value: '1',
      label: 'Internal Messages'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#3AD6F2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>

      ),
      value: '2.4h',
      label: 'Avg Response Time'
    }
  ];

  // Format response time value
  const formatResponseTime = (responseTimeData) => {
    if (!responseTimeData) {
      return '2.4h'; // Default fallback
    }

    const { avg_response_time_hours, avg_response_time_minutes, unit } = responseTimeData;

    if (unit === 'hours') {
      // Format hours with 1 decimal place
      return `${avg_response_time_hours?.toFixed(1) || '0.0'}h`;
    } else if (unit === 'minutes') {
      // Convert minutes to hours if > 60, otherwise show minutes
      if (avg_response_time_minutes >= 60) {
        const hours = (avg_response_time_minutes / 60).toFixed(1);
        return `${hours}h`;
      } else {
        return `${Math.round(avg_response_time_minutes)}m`;
      }
    }

    // Fallback to hours if unit is not specified
    return `${avg_response_time_hours?.toFixed(1) || '0.0'}h`;
  };

  // Add ref for conversations section
  const conversationsSectionRef = useRef(null);

  // Calculate summary stats
  const unreadCount = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  const clientConversations = conversations.filter(conv => !conv.is_staff_conversation).length;
  const internalConversations = conversations.filter(conv => conv.is_staff_conversation).length;

  const updatedSummaryCards = [
    {
      ...summaryCards[0],
      value: unreadCount.toString(),
      filter: 'unread'
    },
    {
      ...summaryCards[1],
      value: clientConversations.toString(),
      filter: 'client'
    },
    {
      ...summaryCards[2],
      value: internalConversations.toString(),
      filter: 'staff'
    },
    {
      ...summaryCards[3],
      value: responseTimeLoading ? '...' : formatResponseTime(avgResponseTime),
      filter: null // No filter for response time
    }
  ];

  // Handle summary card click
  const handleSummaryCardClick = (filter) => {
    if (!filter) return; // Skip if no filter (e.g., response time card)

    // Update the message filter
    setMessageFilter(filter);

    // Scroll to conversations section
    conversationsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#F3F7FF] p-6">
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
            width: 0;
            height: 0;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
      <div className=" mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-6">
            <div>
              <h4 className="text-2xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Messages</h4>
              <p className="text-gray-600 font-[BasisGrotesquePro]">Internal and client communication center</p>
            </div>
            <div className="flex gap-4 mt-4 lg:mt-0">
              {/* <button className="px-4 py-2 bg-white text-gray-700 !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors flex items-center font-[BasisGrotesquePro]">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Archive
              </button>
              <button className="px-4 py-2 bg-white text-gray-700 !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors flex items-center font-[BasisGrotesquePro]">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Bulk Chat
              </button> */}
              <button
                onClick={() => setIsComposeModalOpen(true)}
                className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors flex items-center font-[BasisGrotesquePro]"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Compose
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {updatedSummaryCards.map((card, index) => (
              <div
                key={index}
                onClick={() => handleSummaryCardClick(card.filter)}
                className={`bg-white !rounded-lg !border pt-6 px-4 pb-4 transition-all ${card.filter ? 'cursor-pointer hover:shadow-md' : ''
                  } ${card.filter && messageFilter === card.filter
                    ? 'border-[#3AD6F2] ring-1 ring-[#3AD6F2]'
                    : 'border-[#E8F0FF]'
                  }`}
              >
                <div className="flex items-start justify-between">
                  {/* Left Side - Icon and Label */}
                  <div className="flex flex-col">
                    <div className="text-[#3AD6F2] mb-2">{card.icon}</div>
                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-4">{card.label}</p>
                  </div>
                  {/* Right Side - Number */}
                  <p className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] leading-none">{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Global Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="w-full sm:w-[45%]">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 !border border-[#E8F0FF] rounded-lg focus:outline-none font-[BasisGrotesquePro] bg-white"
                />
              </div>
            </div>
            <div className="relative">
              <select
                value={messageFilter}
                onChange={(e) => setMessageFilter(e.target.value)}
                className="appearance-none bg-white !border border-[#E8F0FF] rounded-lg px-4 py-2 pr-10 text-gray-700 focus:outline-none  font-[BasisGrotesquePro] cursor-pointer min-w-[160px]"
              >
                <option value="all">All Messages</option>
                <option value="client">Client Messages</option>
                <option value="staff">Internal Messages</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area - Two Separate Cards */}
        <div ref={conversationsSectionRef} className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel - Conversations Card */}
          <div className="w-full lg:w-1/3 bg-white rounded-lg  !border border-[#E8F0FF] p-6 h-[600px] flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]">Conversations</h3>

            {/* Conversation Search */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search conversations..."
                value={conversationSearch}
                onChange={(e) => setConversationSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none  font-[BasisGrotesquePro]"
              />
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 hide-scrollbar">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-500">Loading conversations...</div>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-red-500 text-sm">{error}</div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-500 text-sm">No conversations found</div>
                </div>
              ) : (
                conversations
                  .filter(conv => {
                    // Apply message filter (unread, client, staff, all)
                    if (messageFilter === 'unread') {
                      if (!conv.unread_count || conv.unread_count === 0) return false;
                    } else if (messageFilter === 'client') {
                      if (conv.is_staff_conversation) return false;
                    } else if (messageFilter === 'staff') {
                      if (!conv.is_staff_conversation) return false;
                    }
                    // Apply conversation search
                    if (conversationSearch) {
                      const searchLower = conversationSearch.toLowerCase();
                      return (
                        conv.subject?.toLowerCase().includes(searchLower) ||
                        conv.client_name?.toLowerCase().includes(searchLower) ||
                        conv.last_message_preview?.content?.toLowerCase().includes(searchLower)
                      );
                    }
                    return true;
                  })
                  .map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => handleConversationSelect(conv)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedThreadId === conv.id
                        ? 'bg-[#FFF4E6] !border border-[#E8F0FF]'
                        : 'bg-white hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro] truncate flex-1 min-w-0">
                              {conv.client_name || conv.client?.name || conv.assigned_staff_names?.join(', ') || 'All Staff'}
                            </p>
                            {conv.unread_count > 0 && (
                              <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 leading-none">
                                {conv.unread_count}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-[BasisGrotesquePro] flex-shrink-0 whitespace-nowrap !border border-[#E8F0FF] bg-white text-gray-700`}>
                              {conv.is_staff_conversation ? 'Internal' : 'Client'}
                            </span>
                            <button
                              onClick={(e) => handleDeleteThread(conv.id, e)}
                              className="w-5 h-5 flex items-center justify-center text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                              title="Delete thread"
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334ZM6.667 7.333v4M9.333 7.333v4" stroke="currentColor" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-xs text-gray-600 mb-1 line-clamp-2 font-[BasisGrotesquePro]">
                            {conv.last_message_preview?.content || conv.subject || 'No messages'}
                          </p>
                          {conv.last_message_at && (
                            <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                              {formatTimeAgo(conv.last_message_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Right Panel - Message Thread Card */}
          <div className="w-full lg:w-2/3 bg-white !rounded-lg  !border border-[#E8F0FF] p-6 h-[600px] flex flex-col message-thread-card">
            <div className="mb-4 message-thread-header">
              <div className="flex items-center justify-between mb-1 message-thread-title-row">
                <h3 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro]">Message Thread</h3>
                {/* WebSocket Connection Status */}
                {selectedThreadId && (
                  <div className={`text-xs px-2 py-1 rounded-full font-[BasisGrotesquePro] ${wsConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {/* {wsConnected ? '🟢 Connected' : '🔴 Disconnected'} */}
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                {selectedConversation
                  ? `${selectedConversation.client_name || selectedConversation.assigned_staff_names?.join(', ') || 'All Staff'} - ${selectedConversation.subject || 'Untitled'}`
                  : 'Select a conversation to view messages'}
              </p>
              {wsError && (
                <p className="text-xs text-red-600 font-[BasisGrotesquePro] mt-1">
                  {wsError}
                </p>
              )}
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto space-y-4 mb-4 hide-scrollbar message-thread-messages">
              {messagesLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-500">Loading messages...</div>
                </div>
              ) : threadMessages.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-500 text-sm">No messages yet</div>
                </div>
              ) : (
                <>
                  {threadMessages.map((msg) => {
                    // Get current user data to compare with message sender
                    const currentUser = getUserData();
                    const currentUserId = currentUser?.id || currentUser?.user_id || currentUser?.userId;
                    const currentUserName = currentUser?.name || currentUser?.firm_name || 'Seqwens Firm';

                    // Check if message is sent by current user by comparing sender_id
                    let isSentByCurrentUser = false;
                    if (msg.sender_id && currentUserId) {
                      isSentByCurrentUser = String(msg.sender_id) === String(currentUserId) || msg.sender_id === currentUserId;
                    } else {
                      // Fallback: In FirmAdmin, staff messages are "sent" (right side), client messages are "received" (left side)
                      const senderRole = (msg.sender_role || '').toLowerCase();
                      const isStaff = senderRole.includes('staff') || senderRole.includes('admin') || senderRole.includes('accountant') || senderRole.includes('bookkeeper') || senderRole.includes('assistant');
                      isSentByCurrentUser = isStaff;
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`d-flex mb-3 w-100 message-thread-message-item ${isSentByCurrentUser ? 'justify-content-end' : ''}`}
                        style={{ fontFamily: "BasisGrotesquePro", justifyContent: isSentByCurrentUser ? 'flex-end' : 'flex-start' }}
                      >
                        {/* {!isSentByCurrentUser && (
                          <JdIcon color="#f97316" className="me-2" />
                        )} */}
                        <div className={`bg-[#FFF4E6] p-2 px-4 rounded message-thread-message-bubble ${isSentByCurrentUser ? 'mr-4' : 'ml-2'} max-w-[75%] min-w-[80px]`} style={{ fontFamily: "BasisGrotesquePro", marginLeft: isSentByCurrentUser ? '0' : '10px', marginRight: isSentByCurrentUser ? '16px' : '0' }}>
                          <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "4px", fontWeight: "500" }}>
                            {isSentByCurrentUser ? (msg.sender_name || currentUserName) : (msg.sender_name || 'Unknown')}
                          </div>
                          <div style={{ color: "#1F2937" }}>{msg.content}</div>
                          {msg.hasAttachment && (
                            <div className="mt-2">
                              <a
                                href={msg.attachment || msg.attachmentObj?.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                {msg.attachment_name || 'Attachment'}
                              </a>
                            </div>
                          )}
                          <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px", textAlign: isSentByCurrentUser ? "right" : "left" }}>
                            {new Date(msg.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </div>
                        </div>
                        {/* {isSentByCurrentUser && (
                          <JdIcon color="#f97316" className="ms-2" />
                        )} */}
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {typingUsers && typingUsers.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col">
                        <div className="bg-[#FFF4E6] !border border-[#FFE0B2] rounded-lg p-2 inline-block max-w-[80%]">
                          <p className="text-sm text-gray-500 font-[BasisGrotesquePro] italic">
                            {typingUsers.map(u => u.name || 'User').join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scroll anchor for auto-scroll */}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="flex items-center gap-3 !border-t border-[#E8F0FF] pt-4 message-thread-input">
              <input
                ref={threadFileInputRef}
                type="file"
                onChange={handleThreadFileSelect}
                className="hidden"
              />
              <button
                onClick={() => {
                  console.log('Paperclip clicked', { threadFileInputRef: !!threadFileInputRef.current, selectedThreadId, sendingThreadMessage });
                  threadFileInputRef.current?.click();
                }}
                disabled={!selectedThreadId || sendingThreadMessage}
                className="w-10 h-10 !rounded-lg border border-[#E8F0FF] flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed message-thread-attach-btn"
                title="Attach file"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              {threadAttachment && (
                <span className="text-xs text-gray-600 max-w-[100px] truncate message-thread-attachment-name" title={threadAttachment.name}>
                  {threadAttachment.name}
                </span>
              )}
              <input
                type="text"
                value={threadMessageInput}
                onChange={(e) => setThreadMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    console.log('Enter key pressed', { hasInput: !!threadMessageInput.trim(), hasAttachment: !!threadAttachment, sendingThreadMessage, selectedThreadId });
                    if ((threadMessageInput.trim() || threadAttachment) && !sendingThreadMessage && selectedThreadId) {
                      e.preventDefault();
                      handleSendThreadMessage();
                    }
                  }
                }}
                placeholder={selectedThreadId ? "Write your messages here..." : "Select a conversation to send messages"}
                disabled={sendingThreadMessage}
                className="flex-1 w-full px-4 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed message-thread-input-field"
              />
              {threadAttachment && (
                <button
                  onClick={() => setThreadAttachment(null)}
                  className="text-red-500 hover:text-red-700 text-sm px-2 message-thread-remove-attachment"
                  title="Remove attachment"
                >
                  ×
                </button>
              )}
              <button
                onClick={() => {
                  console.log('Send button clicked', { selectedThreadId, hasInput: !!threadMessageInput.trim(), hasAttachment: !!threadAttachment, sendingThreadMessage });
                  handleSendThreadMessage();
                }}
                disabled={!selectedThreadId || !(threadMessageInput.trim() || threadAttachment) || sendingThreadMessage}
                className="w-10 h-10 !rounded-lg bg-[#F56D2D] flex items-center justify-center hover:bg-[#E55A1D] transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed message-thread-send-btn"
              >
                {sendingThreadMessage ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.74979 6.24892L6.87479 8.12392M12.6798 1.89329C12.7391 1.87283 12.803 1.86946 12.8641 1.88357C12.9252 1.89769 12.9812 1.92871 13.0255 1.97311C13.0698 2.01751 13.1008 2.07348 13.1148 2.13463C13.1288 2.19578 13.1253 2.25964 13.1048 2.31892L9.40229 12.9002C9.38014 12.9634 9.33949 13.0186 9.28561 13.0584C9.23174 13.0983 9.16713 13.121 9.10016 13.1237C9.0332 13.1264 8.96697 13.1089 8.91006 13.0735C8.85316 13.0381 8.80821 12.9864 8.78104 12.9252L6.76917 8.39892C6.73532 8.32365 6.67506 8.26339 6.59979 8.22954L2.07354 6.21704C2.01248 6.18978 1.96099 6.14483 1.92573 6.088C1.89047 6.03117 1.87307 5.96508 1.87576 5.89826C1.87845 5.83144 1.90112 5.76696 1.94083 5.71315C1.98055 5.65934 2.03548 5.61868 2.09854 5.59642L12.6798 1.89329Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Compose Message Modal */}
      {isComposeModalOpen && (
        <div className="fixed inset-0 z-[1070] flex items-center justify-center bg-black/40 p-6 compose-modal-overlay">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh] compose-modal-container">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 border-b border-[#E8F0FF] flex-shrink-0 compose-modal-header">
              <div className="compose-modal-header-content">
                <h4 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro]">Compose Message</h4>
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-0.5">Send a message to staff members or clients</p>
              </div>
              <button
                onClick={() => setIsComposeModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors compose-modal-close-btn"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                  <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
                </svg>

              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-3 space-y-3 overflow-y-auto hide-scrollbar flex-1 compose-modal-body">

              {/* Select User (Client, Staff, or Admin) */}
              <div className="compose-modal-section">
                <label className="block text-sm font-medium text-gray-900 mb-1 font-[BasisGrotesquePro]">Select User</label>

                {/* Role Filter */}
                <div className="mb-2 compose-modal-role-filter">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => {
                      setUserRoleFilter(e.target.value);
                      setShowUserDropdown(true);
                    }}
                    className="w-full appearance-none bg-white !border border-[#E8F0FF] rounded-lg px-3 py-2 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro] cursor-pointer"
                  >
                    <option value="">All Users</option>
                    <option value="client">Clients Only</option>
                    <option value="staff">Staff Only</option>
                    <option value="admin">Admins Only</option>
                  </select>
                </div>

                {/* User Search Input */}
                <div className="relative compose-modal-user-search" ref={userDropdownRef}>
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      setShowUserDropdown(true);
                    }}
                    onFocus={() => setShowUserDropdown(true)}
                    placeholder="Search by name, email, or phone..."
                    className="w-full px-3 py-2 !border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                  />
                  {activeUsersLoading && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}

                  {/* User Dropdown */}
                  {showUserDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-[#E8F0FF] rounded-lg shadow-lg max-h-60 overflow-y-auto compose-modal-user-dropdown" style={{ zIndex: 9999 }}>
                      {activeUsers.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 font-[BasisGrotesquePro]">
                          {activeUsersLoading ? 'Loading...' : 'No users found'}
                        </div>
                      ) : (
                        activeUsers.map((user) => {
                          const isSelected = selectedUserId === user.id;
                          return (
                            <div
                              key={user.id}
                              onClick={() => handleUserSelect(user)}
                              className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-[#FFF4E6]' : ''
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                  {user.profile_picture ? (
                                    <img
                                      src={user.profile_picture}
                                      alt={user.full_name}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-[#3AD6F2] flex items-center justify-center text-white font-semibold text-sm">
                                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                  )}
                                </div>
                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro] truncate">
                                      {user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.email}
                                    </p>
                                    {isSelected && (
                                      <svg className="w-4 h-4 text-[#F56D2D] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 font-[BasisGrotesquePro] truncate">{user.email}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-[BasisGrotesquePro]">
                                      {user.role_display || user.role}
                                    </span>
                                    {user.phone_number && (
                                      <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">{user.phone_number}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Selected User Display */}
                {selectedUserId && (
                  <div className="mt-2 p-2 bg-[#FFF4E6] rounded-lg border border-[#FFE0B2] compose-modal-selected-user">
                    <p className="text-xs text-gray-600 font-[BasisGrotesquePro] mb-1">Selected:</p>
                    <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">
                      {activeUsers.find(u => u.id === selectedUserId)?.full_name || userSearchQuery}
                    </p>
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="compose-modal-section">
                <label className="block text-sm font-medium text-gray-900 mb-1 font-[BasisGrotesquePro]">Opening Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full h-32 px-3 py-2 !border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro] resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col gap-3 p-3 border-t border-[#E8F0FF] flex-shrink-0 compose-modal-footer">
              {/* Attach file button - First line */}
              <div className="flex items-center gap-2 compose-modal-attach-row">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-white !border border-[#E8F0FF] !rounded-lg text-gray-700 hover:text-gray-900 font-[BasisGrotesquePro] transition-colors compose-modal-attach-btn"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {attachment ? attachment.name : 'Attach file'}
                </button>
                {attachment && (
                  <button
                    onClick={() => setAttachment(null)}
                    className="text-red-500 hover:text-red-700 text-sm compose-modal-remove-attachment"
                  >
                    Remove
                  </button>
                )}
              </div>
              {/* Cancel and Send buttons - Second line, right aligned */}
              <div className="flex items-center justify-end gap-3 compose-modal-actions">
                <button
                  onClick={() => setIsComposeModalOpen(false)}
                  className="px-4 py-2 bg-white !border border-[#E8F0FF] !rounded-lg text-gray-700 hover:text-gray-900 font-[BasisGrotesquePro] transition-colors compose-modal-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={handleComposeMessage}
                  disabled={sending || !message.trim() || (!selectedUserId && !selectedStaffId)}
                  className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors flex items-center gap-2 font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed compose-modal-send-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.5 1.5L11.25 16.5L8.25 9.75L1.5 6.75L16.5 1.5Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16.5 1.5L8.25 9.75" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[1070] flex items-center justify-center bg-black bg-opacity-50 p-6">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-3 font-[BasisGrotesquePro]">Delete Thread</h4>
              <p className="text-sm text-gray-600 mb-6 font-[BasisGrotesquePro]">
                Are you sure you want to delete this conversation? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setThreadToDelete(null);
                  }}
                  disabled={deleting}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteThread}
                  disabled={deleting}
                  className="px-4 py-2 bg-[#EF4444] text-white rounded-lg hover:bg-[#DC2626] transition-colors font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;


