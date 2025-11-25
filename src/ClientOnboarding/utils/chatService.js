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
   * @param {number} targetUserId - The ID of the user to chat with
   * @returns {Promise<Object>} Response with thread data
   */
  createThread: async (targetUserId) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const API_BASE_URL = getApiBaseUrl();
    const response = await fetchWithCors(`${API_BASE_URL}${API_PREFIX}/chat-threads/create/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target_user_id: targetUserId,
      }),
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
};

