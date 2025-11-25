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
   * Get messages in a chat thread (for initial load or pagination)
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
  createTaxPreparerChat: async (clientUserId) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const API_BASE_URL = getApiBaseUrl();
    
    const requestBody = {
      participant2: clientUserId,
      chat_type: 'tax_preparer_client'
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
   * Mark messages as read in a chat thread
   * POST /seqwens/api/taxpayer/chat-threads/<thread_id>/mark-read/
   * @param {number} threadId - The thread ID
   * @param {number} [messageId] - Optional. Specific message ID to mark as read. If not provided, marks all messages as read.
   * @returns {Promise<Object>} Response
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
};

