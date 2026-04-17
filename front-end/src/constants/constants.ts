export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000/ws';
export const INITIAL_RECONNECT_DELAY = 1000;
export const MAX_RECONNECT_DELAY = 30000;
export const RECONNECT_ATTEMPTS = 5;

export const WS_EVENTS = {
  // Must match backend's WebSocket event names
  PING: "ping",
  JOIN_ROOM: "room:join",
  LEAVE_ROOM: "room:leave",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  MESSAGE_RECEIVE: "message:receive",
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
  PRESENCE_SYNC: "presence:sync",
  PRESENCE_SNAPSHOT: "presence:snapshot",
} as const;

export type WSEventType = typeof WS_EVENTS[keyof typeof WS_EVENTS];
