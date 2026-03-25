import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { firmAdminMessagingAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken, getUserData } from '../../../ClientOnboarding/utils/userUtils';
import { chatService } from '../../../ClientOnboarding/utils/chatService';
import { useChatWebSocket } from '../../../ClientOnboarding/utils/useChatWebSocket';
import { toast } from 'react-toastify';
import {
  MessageIcon,
  UsersIcon,
  TimeIcon,
  SearchIcon,
  ChevronDownIcon,
  PlusIcon,
  DeleteIcon,
  PaperclipIcon,
  SendIcon,
  CloseModalIcon,
  CheckIcon,
  ComposeSendIcon
} from '../../FirmAdminIcons/Icons';
import '../../styles/Message.css';
import { createPortal } from 'react-dom';

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
            // Check for client in conversation (handle object or direct ID)
            if (conv.client) {
              const clientId = typeof conv.client === 'object' ? conv.client.id : conv.client;
              if (clientId) existingThreadUserIds.add(clientId.toString());
            } else if (conv.client_id) {
              existingThreadUserIds.add(conv.client_id.toString());
            }

            // Check for staff in conversation
            if (conv.assigned_staff && Array.isArray(conv.assigned_staff)) {
              conv.assigned_staff.forEach(staff => {
                const staffId = typeof staff === 'object' ? staff.id : staff;
                if (staffId) existingThreadUserIds.add(staffId.toString());
              });
            } else if (conv.staff_id) {
              existingThreadUserIds.add(conv.staff_id.toString());
            }
          });

          users = users.filter(user => user.id && !existingThreadUserIds.has(user.id.toString()));
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
      icon: <MessageIcon />,
      value: '3',
      label: 'Unread Message'
    },
    {
      icon: <UsersIcon />,
      value: '2',
      label: 'Client Conversations'
    },
    {
      icon: <MessageIcon />,
      value: '1',
      label: 'Internal Messages'
    },
    {
      icon: <TimeIcon />,
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
    <div className="min-h-screen px-4 py-6 bg-[#F3F7FF]">
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
              <button
                onClick={() => setIsComposeModalOpen(true)}
                className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors flex items-center font-[BasisGrotesquePro]"
              >
                <PlusIcon />
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
                  <SearchIcon />
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
                <ChevronDownIcon />
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
                <SearchIcon />
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
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 hide-scrollbar">
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
                      className={`p-3 rounded-xl border-2 border-[#E8F0FF] cursor-pointer transition-colors ${selectedThreadId === conv.id
                        ? 'bg-[#E8F0FF]'
                        : 'bg-[#F3F7FF] hover:bg-[#E8F0FF]'
                        }`}
                      style={{ minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
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
                              <DeleteIcon />
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
                                <PaperclipIcon className="w-4 h-4" />
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
                <PaperclipIcon />
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
                  <SendIcon />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isComposeModalOpen && createPortal(
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40 p-6">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh]">
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
                <CloseModalIcon />
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
                                      <CheckIcon />
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
                  <PaperclipIcon className="w-4 h-4" />
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
                  <ComposeSendIcon />
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
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


