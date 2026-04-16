"use client";

import { useCallback, useEffect, useState } from "react";
import {
  INITIAL_RECONNECT_DELAY,
  MAX_RECONNECT_DELAY,
  WS_BASE_URL,
  WS_EVENTS,
} from "@/constants/constants";

type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error";

type Listener = (data: any) => void;

let socket: WebSocket | null = null;
let status: ConnectionStatus = "disconnected";
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let reconnectCount = 0;
let consumerCount = 0;
let manualDisconnect = false;

const listeners = new Map<string, Set<Listener>>();
const statusListeners = new Set<(status: ConnectionStatus) => void>();
const messageListeners = new Set<Listener>();

const notifyStatus = (nextStatus: ConnectionStatus) => {
  status = nextStatus;
  statusListeners.forEach((listener) => listener(nextStatus));
};

const stopHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
};

const startHeartbeat = () => {
  stopHeartbeat();
  heartbeatInterval = setInterval(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: WS_EVENTS.PING }));
    }
  }, 30000);
};

const dispatchMessage = (message: any) => {
  const eventListeners = listeners.get(message?.type);
  if (!eventListeners) return;

  eventListeners.forEach((listener) => {
    listener(message);
  });
};

const scheduleReconnect = () => {
  if (manualDisconnect || reconnectTimeout) return;

  notifyStatus("reconnecting");
  const delay = Math.min(
    INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectCount),
    MAX_RECONNECT_DELAY,
  );

  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    reconnectCount += 1;
    connectSocket();
  }, delay);
};

const connectSocket = () => {
  if (typeof window === "undefined") return;
  if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) {
    return;
  }

  const token = localStorage.getItem("accessToken");
  if (!token) {
    notifyStatus("disconnected");
    return;
  }

  manualDisconnect = false;
  notifyStatus(status === "reconnecting" ? "reconnecting" : "connecting");

  try {
    const url = `${WS_BASE_URL}?token=${token}`;
    const ws = new WebSocket(url);
    socket = ws;

    ws.onopen = () => {
      reconnectCount = 0;
      notifyStatus("connected");
      startHeartbeat();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        messageListeners.forEach((cb) => {
          try {
            cb(message);
          } catch (err) {
            console.error("[WebSocket] message listener error:", err);
          }
        });
        dispatchMessage(message);
      } catch (error) {
        console.error("[WebSocket] Failed to parse message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("[WebSocket] Error:", error);
      notifyStatus("error");
    };

    ws.onclose = (event) => {
      if (socket === ws) {
        socket = null;
      }
      stopHeartbeat();

      if (manualDisconnect || event.code === 1000 || consumerCount === 0) {
        notifyStatus("disconnected");
        return;
      }

      scheduleReconnect();
    };
  } catch (error) {
    console.error("[WebSocket] Connection failed:", error);
    notifyStatus("error");
    scheduleReconnect();
  }
};

const disconnectSocket = () => {
  manualDisconnect = true;

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  stopHeartbeat();

  if (socket) {
    socket.close(1000, "Disconnected by user");
    socket = null;
  }

  notifyStatus("disconnected");
};

const sendSocketMessage = (type: string, payload?: any) => {
  if (socket?.readyState !== WebSocket.OPEN) {
    console.warn("[WebSocket] Cannot send message, socket not connected");
    return;
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    socket.send(JSON.stringify({ type, ...payload }));
    return;
  }

  socket.send(JSON.stringify({ type, payload }));
};

const subscribeToEvent = (event: string, callback: Listener) => {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }

  listeners.get(event)!.add(callback);

  return () => {
    const callbacks = listeners.get(event);
    if (!callbacks) return;
    callbacks.delete(callback);
    if (callbacks.size === 0) {
      listeners.delete(event);
    }
  };
};

const subscribeToStatus = (callback: (status: ConnectionStatus) => void) => {
  statusListeners.add(callback);
  return () => {
    statusListeners.delete(callback);
  };
};

/**
 * useWebSocket Hook
 *
 * Provides an interface to interact with the global WebSocket connection.
 *
 * @param onMessage Optional callback for all messages
 */
export function useWebSocket(onMessage?: (data: any) => void) {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>(status);

  useEffect(() => {
    consumerCount += 1;
    const unsubscribeStatus = subscribeToStatus(setConnectionStatus);

    if (localStorage.getItem("accessToken")) {
      connectSocket();
    }

    const handleStorageChange = () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        connectSocket();
      } else {
        disconnectSocket();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      consumerCount = Math.max(0, consumerCount - 1);
      unsubscribeStatus();
      window.removeEventListener("storage", handleStorageChange);

      if (consumerCount === 0 && !localStorage.getItem("accessToken")) {
        disconnectSocket();
      }
    };
  }, []);

  // Handle general message callback if provided
  useEffect(() => {
    if (!onMessage) return;
    messageListeners.add(onMessage);
    return () => {
      messageListeners.delete(onMessage);
    };
  }, [onMessage]);

  const sendPing = useCallback(() => {
    sendSocketMessage(WS_EVENTS.PING, { timestamp: Date.now() });
  }, []);

  const joinChat = useCallback((chatId: string) => {
    sendSocketMessage(WS_EVENTS.JOIN_ROOM, { room: chatId });
  }, []);

  const leaveChat = useCallback((chatId: string) => {
    sendSocketMessage(WS_EVENTS.LEAVE_ROOM, { room: chatId });
  }, []);

  const emitTyping = useCallback((chatId: string) => {
    sendSocketMessage(WS_EVENTS.TYPING_START, { chatId });
  }, []);

  const emitStopTyping = useCallback((chatId: string) => {
    sendSocketMessage(WS_EVENTS.TYPING_STOP, { chatId });
  }, []);

  const sendChatMessage = useCallback(
    (chatId: string, content: string, tempId?: string) => {
      sendSocketMessage("message:send", { chatId, content, tempId });
    },
    [],
  );

  const connect = useCallback(() => {
    connectSocket();
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
  }, []);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    return subscribeToEvent(event, callback);
  }, []);

  return {
    status: connectionStatus,
    connect,
    disconnect,
    sendMessage: sendSocketMessage,
    subscribe,
    joinChat,
    leaveChat,
    emitTyping,
    emitStopTyping,
    sendChatMessage,
    sendPing,
    subscribeMatch: subscribe,
  };
}
