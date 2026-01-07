import { useEffect, useRef, useState, useCallback } from 'react';
import { getAccessToken } from './userUtils';
import { getApiBaseUrl } from './corsConfig';

/**
 * Custom hook for WebSocket connection to notifications
 * @param {boolean} enabled - Whether to enable the WebSocket connection
 * @param {Function} onNotification - Callback when a new notification is received
 * @param {Function} onUnreadCountUpdate - Callback when unread count is updated
 * @returns {Object} WebSocket state and methods
 */
export const useNotificationWebSocket = (enabled = true, onNotification = null, onUnreadCountUpdate = null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  // Get WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    try {
      const token = getAccessToken();
      if (!token) {
        console.warn('No access token available for WebSocket connection');
        return null;
      }

      // Try to get WebSocket server URL from environment variable first
      const envWsUrl = import.meta.env.VITE_WS_SERVER_URL;
      if (envWsUrl) {
        const wsUrl = `${envWsUrl}/ws/notifications/?token=${token}`;
        return wsUrl;
      }

      // Extract server URL from API base URL
      // API base URL is typically: http://localhost:8000/seqwens/api
      // WebSocket URL should be: ws://localhost:8000/ws/notifications/?token=<token>
      
      const apiBaseUrl = getApiBaseUrl();
      let wsServerUrl;
      
      // Try to extract host and port from API base URL
      try {
        const apiUrl = new URL(apiBaseUrl);
        const host = apiUrl.hostname;
        
        // Extract WebSocket server URL from API base URL
        // If API URL is http://168.231.121.7/seqwens/api, WebSocket should be ws://168.231.121.7
        if (host === '168.231.121.7') {
          wsServerUrl = 'ws://168.231.121.7';
        } else {
          // Use the same host for WebSocket
          wsServerUrl = `ws://${host}`;
        }
      } catch (urlError) {
        // If URL parsing fails, use default
        console.warn('Failed to parse API base URL, using default WebSocket URL');
        wsServerUrl = 'ws://168.231.121.7';
      }
      
      const wsUrl = `${wsServerUrl}/ws/notifications/?token=${token}`;
      return wsUrl;
    } catch (err) {
      console.error('Error constructing WebSocket URL:', err);
      return null;
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!enabled) {
      return;
    }

    try {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      const wsUrl = getWebSocketUrl();
      if (!wsUrl) {
        console.error('WebSocket URL is not available');
        setError('WebSocket URL is not available');
        return;
      }

      console.log('🔔 Connecting to notification WebSocket:', wsUrl.replace(/token=[^&]+/, 'token=***'));

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ Notification WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('🔔 WebSocket notification message received:', data);

          switch (data.type) {
            case 'connection_established':
              // Connection established message
              console.log('✅ Notification WebSocket connection confirmed');
              console.log('Connected as user:', data.user_name || 'Unknown', `(${data.user_id || 'Unknown'})`);
              break;

            case 'notification':
              // New notification received
              if (data.notification && typeof onNotification === 'function') {
                onNotification(data.notification);
              }
              break;

            case 'unread_count':
              // Unread count updated
              if (data.unread_count !== undefined && typeof onUnreadCountUpdate === 'function') {
                onUnreadCountUpdate(data.unread_count);
              }
              break;

            case 'notification_read':
              // Notification marked as read
              if (data.notification_id && typeof onNotification === 'function') {
                // Optionally handle read status update
                console.log('Notification marked as read:', data.notification_id);
              }
              break;

            case 'error':
              // Error message
              console.error('Notification WebSocket error:', data.message);
              setError(data.message);
              break;

            default:
              console.log('Unknown notification WebSocket message type:', data.type);
          }
        } catch (err) {
          console.error('Error parsing notification WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Notification WebSocket error:', error);
        // setError('WebSocket connection error');
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log('🔔 Notification WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);

        // Attempt to reconnect if not a normal closure
        // if (event.code !== 1000 && enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
        //   reconnectAttemptsRef.current += 1;
        //   console.log(`🔄 Attempting to reconnect notification WebSocket (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          
        //   reconnectTimeoutRef.current = setTimeout(() => {
        //     connect();
        //   }, reconnectDelay);
        // } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        //   console.error('❌ Failed to connect notification WebSocket after maximum attempts');
        //   setError('Failed to connect. Please refresh the page.');
        // }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('❌ Error connecting to notification WebSocket:', err);
      setError('Failed to connect to notifications');
      setIsConnected(false);
    }
  }, [enabled, getWebSocketUrl, onNotification, onUnreadCountUpdate]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    setIsConnected(false);
    setError(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  // Connect when enabled changes
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    error,
    connect,
    disconnect,
  };
};

