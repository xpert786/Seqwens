import { useEffect, useRef, useState, useCallback } from 'react';
import { getAccessToken } from './userUtils';
import { getApiBaseUrl } from './corsConfig';

/**
 * Custom hook for WebSocket connection to chat-thread messaging
 * Uses the new WebSocket endpoint: /ws/chat-thread/<thread_id>/
 * @param {number|null} threadId - The thread ID to connect to
 * @param {boolean} enabled - Whether to enable the WebSocket connection
 * @returns {Object} WebSocket state and methods
 */
export const useChatWebSocket = (threadId, enabled = true) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  // Get WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    if (!threadId) return null;

    const token = getAccessToken();
    if (!token) {
      console.error('No authentication token found');
      return null;
    }

    // Get base URL - use environment variable or default
    const apiBaseUrl = getApiBaseUrl();
    // Extract host from API URL (remove /seqwens/api path)
    try {
      const url = new URL(apiBaseUrl);
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      // Remove /seqwens/api from the path, keep just the host
      const wsHost = `${wsProtocol}//${url.host}`;
      
      // Use the new WebSocket endpoint format
      // WebSocket endpoint should be at the root, not under /seqwens/api
      return `${wsHost}/ws/chat-thread/${threadId}/?token=${token}`;
    } catch (error) {
      console.error('Error constructing WebSocket URL:', error);
      // Fallback to default localhost
      return `ws://localhost:8000/ws/chat-thread/${threadId}/?token=${token}`;
    }
  }, [threadId]);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (!threadId || !enabled) {
      return;
    }

    try {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      const wsUrl = getWebSocketUrl();
      if (!wsUrl) {
        setError('Unable to construct WebSocket URL');
        return;
      }

      console.log('Connecting to WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket connected to chat thread:', threadId);
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);

          switch (data.type) {
            case 'connection_established':
              // Connection established message
              console.log('✅ WebSocket connection confirmed to thread:', data.thread_id);
              break;

            case 'message':
              // New message received
              if (data.data) {
                const message = data.data;
                setMessages((prev) => {
                  // Check if message already exists
                  const exists = prev.some((m) => m.id === message.id);
                  if (exists) {
                    return prev;
                  }
                  return [...prev, message];
                });
              }
              break;

            case 'typing':
              // Typing indicator
              if (data.user_id !== undefined) {
                const { user_id, is_typing } = data;
                setTypingUsers((prev) => {
                  if (is_typing) {
                    // Add user if not already in the array
                    if (!prev.includes(user_id)) {
                      return [...prev, user_id];
                    }
                    return prev;
                  } else {
                    // Remove user from array
                    return prev.filter(id => id !== user_id);
                  }
                });
              }
              break;

            case 'error':
              // Error message
              console.error('WebSocket error:', data.message);
              setError(data.message);
              break;

            default:
              console.log('Unknown WebSocket message type:', data.type);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Failed to connect. Please refresh the page.');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Error connecting to WebSocket:', err);
      setError('Failed to connect to chat');
      setIsConnected(false);
    }
  }, [threadId, enabled, getWebSocketUrl]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    setIsConnected(false);
    setError(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  // Send message via WebSocket
  const sendMessage = useCallback((content, isInternal = false) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }

    try {
      const message = {
        type: 'send_message',
        content: content.trim(),
        is_internal: isInternal,
      };

      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('Error sending message via WebSocket:', err);
      return false;
    }
  }, []);

  // Send typing indicator
  const sendTyping = useCallback((isTyping) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const message = {
        type: 'typing',
        is_typing: isTyping,
      };

      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('Error sending typing indicator:', err);
      return false;
    }
  }, []);

  // Mark specific message as read
  const markAsRead = useCallback((messageId) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const message = {
        type: 'mark_read',
        message_id: messageId,
      };

      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('Error sending read receipt:', err);
      return false;
    }
  }, []);

  // Mark all messages as read
  const markAllAsRead = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const message = {
        type: 'mark_read',
      };

      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('Error marking all messages as read:', err);
      return false;
    }
  }, []);

  // Connect when threadId changes
  useEffect(() => {
    if (threadId && enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [threadId, enabled, connect, disconnect]);

  // Clear typing users after 3 seconds
  useEffect(() => {
    if (typingUsers.length > 0) {
      const timeout = setTimeout(() => {
        setTypingUsers([]);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [typingUsers]);

  return {
    isConnected,
    messages,
    typingUsers,
    error,
    sendMessage,
    sendTyping,
    markAsRead,
    markAllAsRead,
    connect,
    disconnect,
  };
};

