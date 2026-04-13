export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000/ws';
export const INITIAL_RECONNECT_DELAY = 1000;
export const MAX_RECONNECT_DELAY = 30000;
export const RECONNECT_ATTEMPTS = 5;

export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  MESSAGE: 'message',
  ERROR: 'error',
  JOIN_CHAT: 'join_chat',
  LEAVE_CHAT: 'leave_chat',
  TYPING: 'typing',
  STOP_TYPING: 'stop_typing',
  NEW_MESSAGE: 'new_message',
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_READ: 'message_read',
  USER_STATUS: 'user_status',
} as const;

export type WSEventType = typeof WS_EVENTS[keyof typeof WS_EVENTS];
