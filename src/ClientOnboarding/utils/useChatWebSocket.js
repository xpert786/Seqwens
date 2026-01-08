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
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s (max 30s)
  const getReconnectDelay = (attempt) => Math.min(1000 * Math.pow(2, attempt), 30000);

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
      // Fallback to default server
      return `ws://168.231.121.7/ws/chat-thread/${threadId}/?token=${token}`;
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
              // Connection established - messages are automatically marked as read
              console.log('✅ WebSocket connection confirmed to thread:', data.thread_id);
              console.log(`✅ ${data.unread_count || 0} messages were automatically marked as read`);
              // Mark all existing messages as read in local state
              setMessages((prev) =>
                prev.map((msg) => ({
                  ...msg,
                  is_read: true,
                  read_at: msg.read_at || new Date().toISOString()
                }))
              );
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
              // Typing indicator (matching guide format)
              if (data.user_id !== undefined) {
                const { user_id, user_name, is_typing } = data;
                setTypingUsers((prev) => {
                  if (is_typing) {
                    // Add user if not already in the array
                    const exists = prev.find(u => u.id === user_id);
                    if (!exists) {
                      return [...prev, { id: user_id, name: user_name || 'User' }];
                    }
                    return prev;
                  } else {
                    // Remove user from array
                    return prev.filter(u => u.id !== user_id);
                  }
                });
              }
              break;

            case 'messages_read':
              // Another user has read messages (broadcast notification)
              console.log(`${data.user_name || 'User'} has read messages in thread ${data.thread_id}`);
              // Update messages to reflect read status if needed
              // Note: This is just a notification, actual read status is handled server-side
              break;

            case 'read_confirmation':
              // Response to mark_read command
              console.log('✅ Messages marked as read:', data.message || 'All messages');
              // Update local state to reflect read status
              if (data.message_id) {
                // Specific message marked as read
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === data.message_id
                      ? { ...msg, is_read: true, read_at: data.read_at || new Date().toISOString() }
                      : msg
                  )
                );
              } else {
                // All messages marked as read
                setMessages((prev) =>
                  prev.map((msg) => ({
                    ...msg,
                    is_read: true,
                    read_at: msg.read_at || new Date().toISOString()
                  }))
                );
              }
              break;

            case 'message_read':
              // Legacy: Message marked as read (matching guide format)
              if (data.message_id) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === data.message_id
                      ? { ...msg, is_read: true, read_at: data.read_at }
                      : msg
                  )
                );
              }
              break;

            case 'connection_status':
              // Connection status message (matching guide format)
              console.log('Connection status:', data.status, 'Thread ID:', data.thread_id);
              if (data.status === 'connected') {
                setIsConnected(true);
                setError(null);
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
        // setError('WebSocket connection error');
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);

        // // Attempt to reconnect if not a normal closure (with exponential backoff)
        // if (event.code !== 1000 && enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
        //   reconnectAttemptsRef.current += 1;
        //   const delay = getReconnectDelay(reconnectAttemptsRef.current);
        //   console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts}) in ${delay}ms...`);

        //   reconnectTimeoutRef.current = setTimeout(() => {
        //     connect();
        //   }, delay);
        // } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        //   setError('Failed to connect. Please refresh the page.');
        // }
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

  // Fallback: Send message via REST API
  const sendMessageViaAPI = useCallback(async (threadId, content, isInternal = false) => {
    try {
      const token = getAccessToken();
      const apiBaseUrl = getApiBaseUrl();
      
      const response = await fetch(
        `${apiBaseUrl}/taxpayer/chat-threads/${threadId}/send_message/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            content: content.trim(),
            is_internal: isInternal 
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Add the sent message to local state
          setMessages(prev => {
            const exists = prev.some(m => m.id === result.data.id);
            if (exists) return prev;
            return [...prev, result.data];
          });
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Error sending message via API:', err);
      setError('Failed to send message');
      return false;
    }
  }, []);

  // Send message via WebSocket (with REST API fallback)
  const sendMessage = useCallback((content, isInternal = false) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
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
        // Fallback to REST API
        if (threadId) {
          sendMessageViaAPI(threadId, content, isInternal);
        }
        return false;
      }
    } else {
      // WebSocket not connected, use REST API fallback
      console.log('WebSocket not connected, using REST API fallback');
      if (threadId) {
        sendMessageViaAPI(threadId, content, isInternal);
        return true;
      }
      return false;
    }
  }, [threadId, sendMessageViaAPI]);

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

  // Mark specific message as read (optional - messages are auto-marked on connect/fetch)
  const markAsRead = useCallback(async (messageId) => {
    // Try WebSocket first if available
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        const message = {
          type: 'mark_read',
          message_id: messageId || null, // null to mark all, or specific message_id
        };
        wsRef.current.send(JSON.stringify(message));
        return true;
      } catch (err) {
        console.error('Error sending read receipt via WebSocket:', err);
        // Fall through to HTTP fallback
      }
    }

    // HTTP fallback when WebSocket is not available
    if (threadId) {
      try {
        const { chatService } = await import('./chatService');
        await chatService.markThreadMessagesAsRead(threadId, messageId);
        return true;
      } catch (err) {
        console.error('Error marking message as read via HTTP:', err);
        return false;
      }
    }

    return false;
  }, [threadId]);

  // Mark all messages as read
  const markAllAsRead = useCallback(async () => {
    // Try WebSocket first if available
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        const message = {
          type: 'mark_read',
          // Mark all messages (no specific message_id)
        };
        wsRef.current.send(JSON.stringify(message));
        
        // Optimistically update local state
        setMessages(prev => prev.map(msg => ({ ...msg, is_read: true })));
        return true;
      } catch (err) {
        console.error('Error marking all messages as read via WebSocket:', err);
        // Fall through to HTTP fallback
      }
    }

    // HTTP fallback when WebSocket is not available
    if (threadId) {
      try {
        const { chatService } = await import('./chatService');
        await chatService.markThreadMessagesAsRead(threadId);
        // Optimistically update local state
        setMessages(prev => prev.map(msg => ({ ...msg, is_read: true })));
        return true;
      } catch (err) {
        console.error('Error marking all messages as read via HTTP:', err);
        return false;
      }
    }

    return false;
  }, [threadId]);

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

