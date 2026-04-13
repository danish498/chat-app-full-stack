"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { WS_BASE_URL, INITIAL_RECONNECT_DELAY, MAX_RECONNECT_DELAY, WS_EVENTS } from '@/constants/constants';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

interface WebSocketContextType {
  socket: WebSocket | null;
  status: ConnectionStatus;
  sendMessage: (type: string, payload: any) => void;
  subscribe: (event: string, callback: (data: any) => void) => () => void;
  connect: () => void;
  disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [token, setToken] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);
  const listenersRef = useRef<Record<string, Set<(data: any) => void>>>({});

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');
    const token = localStorage.getItem('accessToken');
    const url = token ? `${WS_BASE_URL}?token=${token}` : WS_BASE_URL;

    try {
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setStatus('connected');
        reconnectCountRef.current = 0;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        startHeartbeat();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, payload } = message;
          
          if (listenersRef.current[type]) {
            listenersRef.current[type].forEach(callback => callback(payload));
          }
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        setStatus('disconnected');
        socketRef.current = null;
        stopHeartbeat();
        
        // Auto-reconnect logic
        if (event.code !== 1000) { // 1000 is normal closure
          handleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setStatus('error');
      };
    } catch (err) {
      console.error('[WebSocket] Connection failed:', err);
      setStatus('error');
      handleReconnect();
    }
  }, []);

  const handleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) return;

    setStatus('reconnecting');
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectCountRef.current),
      MAX_RECONNECT_DELAY
    );

    console.log(`[WebSocket] Reconnecting in ${delay}ms... (Attempt ${reconnectCountRef.current + 1})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectCountRef.current += 1;
      reconnectTimeoutRef.current = null;
      connect();
    }, delay);
  }, [connect]);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 seconds
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close(1000, 'User logged out or app unmounted');
      socketRef.current = null;
    }
    stopHeartbeat();
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setStatus('disconnected');
  }, [stopHeartbeat]);

  const sendMessage = useCallback((type: string, payload: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('[WebSocket] Cannot send message, socket not connected');
    }
  }, []);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = new Set();
    }
    listenersRef.current[event].add(callback);

    return () => {
      listenersRef.current[event].delete(callback);
      if (listenersRef.current[event].size === 0) {
        delete listenersRef.current[event];
      }
    };
  }, []);

  // Sync token from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('accessToken'));
    };
    
    // Initial token
    handleStorageChange();

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Reconnect if token changes
  useEffect(() => {
    if (token) {
      connect();
    } else if (status === 'connected' || status === 'connecting') {
      disconnect();
    }
  }, [token, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <WebSocketContext.Provider value={{ 
      socket: socketRef.current, 
      status, 
      sendMessage, 
      subscribe, 
      connect, 
      disconnect 
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};
