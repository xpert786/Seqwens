import { useEffect, useRef, useState, useCallback } from 'react';
import { getAccessToken } from './userUtils';
import { getApiBaseUrl } from './corsConfig';

/**
 * Custom hook for WebSocket connection to thread messaging
 * @param {number|null} threadId - The thread ID to connect to
 * @param {boolean} enabled - Whether to enable the WebSocket connection
 * @returns {Object} WebSocket state and methods
 */
export const useThreadWebSocket = (threadId, enabled = true) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  // Get WebSocket URL from API config
  const getWebSocketUrl = useCallback(async () => {
    try {
      const token = getAccessToken();
      const apiBaseUrl = getApiBaseUrl();
      
      // Get WebSocket config from API
      const response = await fetch(`${apiBaseUrl}/taxpayer/threads/websocket-config/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const serverUrl = data.data.websocket_server_url || 'ws://168.231.121.7:8000';
          return `${serverUrl}/ws/thread/${threadId}/?token=${token}`;
        }
      }
      
      // Fallback to default URL
      const defaultServerUrl = 'ws://168.231.121.7:8000';
      return `${defaultServerUrl}/ws/thread/${threadId}/?token=${token}`;
    } catch (err) {
      console.error('Error getting WebSocket config:', err);
      // Fallback to default URL
      const token = getAccessToken();
      const defaultServerUrl = 'ws://168.231.121.7:8000';
      return `${defaultServerUrl}/ws/thread/${threadId}/?token=${token}`;
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

      const wsUrl = await getWebSocketUrl();
      console.log('Connecting to WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket connected to thread:', threadId);
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);

          switch (data.type) {
            case 'connection':
              if (data.status === 'connected') {
                console.log('✅ WebSocket connection confirmed');
              }
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
              if (data.data) {
                const { user_id, user_name, is_typing } = data.data;
                setTypingUsers((prev) => {
                  if (is_typing) {
                    // Add user to typing list if not already there
                    if (!prev.find((u) => u.id === user_id)) {
                      return [...prev, { id: user_id, name: user_name }];
                    }
                    return prev;
                  } else {
                    // Remove user from typing list
                    return prev.filter((u) => u.id !== user_id);
                  }
                });
              }
              break;

            case 'message_read':
              // Message read receipt
              if (data.data) {
                const { message_id } = data.data;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === message_id ? { ...msg, is_read: true } : msg
                  )
                );
              }
              break;

            case 'error':
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
        action: 'send_message',
        content: content.trim(),
        message_type: 'text',
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
        action: 'typing',
        is_typing: isTyping,
      };

      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('Error sending typing indicator:', err);
      return false;
    }
  }, []);

  // Mark message as read
  const markAsRead = useCallback((messageId) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const message = {
        action: 'read_receipt',
        message_id: messageId,
      };

      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('Error sending read receipt:', err);
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
    connect,
    disconnect,
  };
};

