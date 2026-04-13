"use client";

import { useCallback, useEffect } from 'react';
import { useWebSocketContext } from '@/context/WebSocketContext';
import { WS_EVENTS } from '@/constants/constants';

/**
 * useWebSocket Hook
 * 
 * Provides an interface to interact with the global WebSocket connection.
 * 
 * @param onMessage Optional callback for all messages
 */
export function useWebSocket(onMessage?: (data: any) => void) {
  const { status, sendMessage, subscribe, connect, disconnect } = useWebSocketContext();

  // Handle general message subscription if provided
  useEffect(() => {
    if (onMessage) {
      return subscribe(WS_EVENTS.NEW_MESSAGE, onMessage);
    }
  }, [onMessage, subscribe]);

  const sendPing = useCallback(() => {
    sendMessage('ping', { timestamp: Date.now() });
  }, [sendMessage]);

  const joinChat = useCallback((chatId: string) => {
    sendMessage(WS_EVENTS.JOIN_CHAT, { chatId });
  }, [sendMessage]);

  const leaveChat = useCallback((chatId: string) => {
    sendMessage(WS_EVENTS.LEAVE_CHAT, { chatId });
  }, [sendMessage]);

  const emitTyping = useCallback((chatId: string) => {
    sendMessage(WS_EVENTS.TYPING, { chatId });
  }, [sendMessage]);

  const emitStopTyping = useCallback((chatId: string) => {
    sendMessage(WS_EVENTS.STOP_TYPING, { chatId });
  }, [sendMessage]);

  const sendChatMessage = useCallback((chatId: string, content: string, tempId?: string) => {
    sendMessage(WS_EVENTS.NEW_MESSAGE, { chatId, content, tempId });
  }, [sendMessage]);

  // Compatibility mapping for the existing chat.tsx usage
  const connectGlobal = useCallback(() => {
    connect();
  }, [connect]);

  // Placeholder for subscribeMatch if needed (from user's previous code)
  const subscribeToEvent = useCallback((event: string, callback: (data: any) => void) => {
    return subscribe(event, callback);
  }, [subscribe]);

  return {
    status,
    connectGlobal,
    disconnect,
    sendMessage,
    subscribe: subscribeToEvent,
    joinChat,
    leaveChat,
    emitTyping,
    emitStopTyping,
    sendChatMessage,
    sendPing,
    // Legacy support for what was requested/expected
    subscribeMatch: subscribeToEvent, 
  };
}
