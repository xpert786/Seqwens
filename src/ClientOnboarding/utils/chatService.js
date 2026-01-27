import { getAccessToken } from './userUtils';
import { getApiBaseUrl, fetchWithCors } from './corsConfig';

const API_PREFIX = '/taxpayer';

/**
 * Chat Service for the new chat-threads API
 * Uses endpoints: /api/taxpayer/chat-threads/
 */
export const chatService = {
  /**
   * Create a new chat thread
   * Option 1: Simple (no parameters) - uses assigned tax preparer automatically
   * Option 2: With targetUserId - creates thread with specific user
   * @param {number} [targetUserId] - Optional. The ID of the user to chat with. If not provided, uses assigned tax preparer.
   * @returns {Promise<Object>} Response with thread data
   */
  createThread: async (targetUserId) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const API_BASE_URL = getApiBaseUrl();

    // Prepare request body - empty if no targetUserId provided
    const requestBody = targetUserId
      ? { target_user_id: targetUserId }
      : {};

    const response = await fetchWithCors(`${API_BASE_URL}${API_PREFIX}/chat-threads/create/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Get all chat threads for the authenticated user
   * @returns {Promise<Object>} Response with array of threads
   */
  getThreads: async () => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const API_BASE_URL = getApiBaseUrl();
    const response = await fetchWithCors(`${API_BASE_URL}${API_PREFIX}/chat-threads/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Get details of a specific chat thread
   * @param {number} threadId - The thread ID
   * @returns {Promise<Object>} Response with thread details
   */
  getThread: async (threadId) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const API_BASE_URL = getApiBaseUrl();
    const response = await fetchWithCors(`${API_BASE_URL}${API_PREFIX}/chat-threads/${threadId}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Delete a chat thread
   * DELETE /seqwens/api/taxpayer/chat-threads/<thread_id>/
   * @param {number} threadId - The thread ID
   * @returns {Promise<Object>} Response
   */
  deleteThread: async (threadId) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const API_BASE_URL = getApiBaseUrl();
    const response = await fetchWithCors(`${API_BASE_URL}${API_PREFIX}/chat-threads/${threadId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
    }

    // DELETE requests might not return JSON content
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true };
    }

    return await response.json().catch(() => ({ success: true }));
  },

  /**
   * Get messages in a chat thread (for initial load or pagination)
   * GET /seqwens/api/taxpayer/chat-threads/<thread_id>/messages/
   * Note: This endpoint automatically marks all unread messages as read when called
   * @param {number} threadId - The thread ID
   * @param {number} page - Page number (default: 1)
   * @param {number} pageSize - Messages per page (default: 50, max: 100)
   * @returns {Promise<Object>} Response with messages and pagination info
   */
  getMessages: async (threadId, page = 1, pageSize = 50) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const API_BASE_URL = getApiBaseUrl();
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: Math.min(pageSize, 100).toString(),
    });

    const response = await fetchWithCors(
      `${API_BASE_URL}${API_PREFIX}/chat-threads/${threadId}/messages/?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Create a new chat for tax preparer with a client
   * POST /seqwens/api/taxpayer/chat/create/
   * @param {number} clientUserId - The ID of the client user to chat with
   * @returns {Promise<Object>} Response with chat data
   */
  createTaxPreparerChat: async (clientUserId, chatData = {}) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const API_BASE_URL = getApiBaseUrl();

    const requestBody = {
      participant2: clientUserId,
      chat_type: 'tax_preparer_client',
      subject: chatData.subject || '',
      category: chatData.category || 'Client',
      priority: chatData.priority || 'Medium',
      opening_message: chatData.opening_message || ''
    };

    const response = await fetchWithCors(`${API_BASE_URL}${API_PREFIX}/chat/create/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Mark messages as read in a chat thread (explicit)
   * POST /seqwens/api/taxpayer/chat-threads/<thread_id>/mark-read/
   * Note: Messages are automatically marked as read when:
   * - User connects via WebSocket (connection_established event)
   * - User fetches messages via GET /chat-threads/<thread_id>/messages/
   * This endpoint is for explicit/manual marking when needed
   * @param {number} threadId - The thread ID
   * @param {number} [messageId] - Optional. Specific message ID to mark as read. If not provided, marks all messages as read.
   * @returns {Promise<Object>} Response with marked_count and thread_id
   */
  markThreadMessagesAsRead: async (threadId, messageId = null) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const API_BASE_URL = getApiBaseUrl();

    const requestBody = messageId ? { message_id: messageId } : {};

    const response = await fetchWithCors(`${API_BASE_URL}${API_PREFIX}/chat-threads/${threadId}/mark-read/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Mark messages as read in a chat
   * POST /seqwens/api/taxpayer/chat/<chat_id>/mark-read/
   * @param {number} chatId - The chat ID
   * @param {number} [messageId] - Optional. Specific message ID to mark as read. If not provided, marks all messages as read.
   * @returns {Promise<Object>} Response
   */
  markChatMessagesAsRead: async (chatId, messageId = null) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const API_BASE_URL = getApiBaseUrl();

    const requestBody = messageId ? { message_id: messageId } : {};

    const response = await fetchWithCors(`${API_BASE_URL}${API_PREFIX}/chat/${chatId}/mark-read/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Send a message in a chat thread
   * POST /seqwens/api/taxpayer/chat-threads/<thread_id>/send_message/
   * Supports:
   * - Text messages (JSON)
   * - File attachments (multipart/form-data)
   * - Base64 encoded files (JSON)
   * 
   * @param {number} threadId - The thread ID
   * @param {Object} messageData - Message data
   * @param {string} [messageData.content] - Message text content (optional)
   * @param {string} [messageData.message_type] - Type of message: "text" or "file" (default: "text")
   * @param {File|Blob} [messageData.attachment] - File attachment (for multipart/form-data)
   * @param {string} [messageData.file] - Base64 encoded file content
   * @param {string} [messageData.file_name] - Name of the file (required if using base64)
   * @param {boolean} [messageData.is_internal] - If true, message is only visible to staff (default: false)
   * @returns {Promise<Object>} Response with created message
   */
  sendMessage: async (threadId, messageData) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const API_BASE_URL = getApiBaseUrl();
    let config;
    let response;

    // Check if we have a file attachment (multipart/form-data)
    const hasFileAttachment = messageData.attachment && messageData.attachment instanceof File || messageData.attachment instanceof Blob;

    // Check if we have base64 encoded file
    const hasBase64File = messageData.file || messageData.attachment_base64;

    if (hasFileAttachment) {
      // Use FormData for file attachments
      const formData = new FormData();

      if (messageData.content) {
        formData.append('content', messageData.content);
      }

      if (messageData.message_type) {
        formData.append('message_type', messageData.message_type);
      } else if (hasFileAttachment) {
        formData.append('message_type', 'file');
      }

      if (messageData.is_internal !== undefined) {
        formData.append('is_internal', messageData.is_internal ? 'True' : 'False');
      }

      if (messageData.attachment) {
        formData.append('attachment', messageData.attachment);
      }

      config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
        body: formData
      };
    } else if (hasBase64File) {
      // Use JSON for base64 encoded files
      const payload = {};

      if (messageData.content) {
        payload.content = messageData.content;
      }

      payload.message_type = messageData.message_type || 'file';

      if (messageData.file) {
        payload.file = messageData.file;
      } else if (messageData.attachment_base64) {
        payload.file = messageData.attachment_base64;
      }

      if (messageData.file_name) {
        payload.file_name = messageData.file_name;
      } else if (messageData.attachment_name) {
        payload.file_name = messageData.attachment_name;
      } else {
        throw new Error('file_name is required when using base64 encoded file');
      }

      if (messageData.is_internal !== undefined) {
        payload.is_internal = messageData.is_internal;
      }

      config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      };
    } else {
      // Use JSON for text-only messages
      const payload = {
        content: messageData.content || '',
        message_type: messageData.message_type || 'text',
      };

      if (messageData.is_internal !== undefined) {
        payload.is_internal = messageData.is_internal;
      }

      config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      };
    }

    response = await fetchWithCors(`${API_BASE_URL}${API_PREFIX}/chat-threads/${threadId}/send_message/`, config);

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401) {
      try {
        const { refreshAccessToken } = await import('./apiUtils');
        await refreshAccessToken();
        const newToken = getAccessToken();

        if (!newToken) {
          throw new Error('Token refresh failed');
        }

        if (hasFileAttachment) {
          config.headers = {
            'Authorization': `Bearer ${newToken}`,
          };
        } else {
          config.headers = {
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json',
          };
        }

        response = await fetchWithCors(`${API_BASE_URL}${API_PREFIX}/chat-threads/${threadId}/send_message/`, config);

        if (response.status === 401) {
          const { clearUserData } = await import('./userUtils');
          const { getLoginUrl } = await import('./urlUtils');
          clearUserData();
          window.location.href = getLoginUrl();
          throw new Error('Session expired. Please login again.');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        const { clearUserData } = await import('./userUtils');
        const { getLoginUrl } = await import('./urlUtils');
        clearUserData();
        window.location.href = getLoginUrl();
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  },
};

