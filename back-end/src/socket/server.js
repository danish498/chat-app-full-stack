import { WebSocketServer } from "ws";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import logger from "../utils/logger.js";
import { db } from "../db/db.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

// ─── Events Constants ────────────────────────────────────────────────────────

const EVENTS = {
  CONNECTION: {
    CONNECT: "connect",
    DISCONNECT: "disconnect",
    RECONNECT: "reconnect",
  },
  MESSAGING: {
    SEND: "message:send",
    RECEIVE: "message:receive",
    EDIT: "message:edit",
    DELETE: "message:delete",
    REACT: "message:react",
    READ: "message:read",
  },
  PRESENCE: {
    ONLINE: "user:online",
    OFFLINE: "user:offline",
    SYNC: "presence:sync",
    SNAPSHOT: "presence:snapshot",
    TYPING_START: "typing:start",
    TYPING_STOP: "typing:stop",
  },
  ROOM: {
    JOIN: "room:join",
    LEAVE: "room:leave",
    CREATE: "room:create",
    DELETE: "room:delete",
    UPDATE: "room:update",
    MEMBER_ADD: "member:add",
    KICKED: "member:kicked",
  },
  NOTIFICATION: {
    PUSH: "notification:push",
    MENTION: "mention",
    CLEAR_MENTION: "mention:clear",
  },
  FILE: {
    UPLOAD: "file:upload",
    DOWNLOAD: "file:download",
  },
  ERROR: {
    AUTH: "error:auth",
    RATE_LIMIT: "error:rate_limit",
    PAYLOAD_TOO_LARGE: "error:payload_too_large",
  },
  SYSTEM: {
    HEALTH: "server:health",
    SHUTDOWN: "server:shutdown",
    CONFIG_UPDATE: "config:update",
    FEATURE_FLAG: "feature:flag",
  },
};

// ─── State ───────────────────────────────────────────────────────────────────

const clients = new Map(); // socketId  → socket
const userSockets = new Map(); // userId    → Set<socketId>
const rooms = new Map(); // roomName  → Set<socketId>
let heartbeatInterval = null;
let healthInterval = null;

// ─── Pub / Sub ────────────────────────────────────────────────────────────────

const subscribe = (socketId, room) => {
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room).add(socketId);
};

const unsubscribe = (socketId, room) => {
  if (!rooms.has(room)) return;
  rooms.get(room).delete(socketId);
  if (rooms.get(room).size === 0) rooms.delete(room);
};

const cleanupSubscriptions = (socketId) => {
  for (const [room, members] of rooms.entries()) {
    members.delete(socketId);
    if (members.size === 0) rooms.delete(room);
  }
};

// ─── Messaging ────────────────────────────────────────────────────────────────

const sendJsonMessage = (socket, payload) => {
  if (socket.readyState !== socket.OPEN) return;
  try {
    socket.send(JSON.stringify(payload));
  } catch (err) {
    logger.error("[ws] sendJsonMessage failed:", err.message);
  }
};

const broadcastToUser = (userId, payload) => {
  const socketIds = userSockets.get(userId);
  if (!socketIds) return;
  for (const id of socketIds) {
    const socket = clients.get(id);
    if (socket) sendJsonMessage(socket, payload);
  }
};

const broadcastToRoom = (room, payload, excludeSocketId = null) => {
  const members = rooms.get(room);
  if (!members) return;
  for (const id of members) {
    if (id === excludeSocketId) continue;
    const socket = clients.get(id);
    if (socket) sendJsonMessage(socket, payload);
  }
};

const broadcastToAll = (payload, excludeSocketId = null) => {
  for (const [id, socket] of clients.entries()) {
    if (id === excludeSocketId) continue;
    sendJsonMessage(socket, payload);
  }
};

// ─── Lifecycle ────────────────────────────────────────────────────────────────

const authenticate = (request) => {
  try {
    const url = new URL(
      request.url,
      `http://${request.headers.host || "localhost"}`,
    );
    const token = url.searchParams.get("token");

    console.log("token", token);

    if (!token) return null;

    const decoded = jwt.verify(token, config.jwt.accessSecret);
    console.log("decoded", decoded);
    return { userId: decoded.userId };
  } catch (error) {
    logger.error("[ws] auth failed:", error.message);
    return null;
  }
};

const onConnect = (socket, userId) => {
  console.log("onConnsadfasfsafsfsect", socket, userId);
  const socketId = randomUUID();
  socket.socketId = socketId;
  socket.userId = userId;
  socket.isAlive = true;

  clients.set(socketId, socket);

  const isFirstSocket = !userSockets.has(userId);
  console.log("isFirstSocket", isFirstSocket);
  if (isFirstSocket) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId).add(socketId);

  socket.on("pong", () => {
    socket.isAlive = true;
  });

  socket.on("message", (raw) => onMessage(socket, raw));
  socket.on("close", () => onDisconnect(socket));
  socket.on("error", (err) => {
    logger.error(`[ws] socket error (${socketId}):`, err.message);
  });

  sendJsonMessage(socket, { type: EVENTS.CONNECTION.CONNECT, socketId });
  logger.info(`[ws] connected  socketId=${socketId} userId=${userId}`);

  console.log('asfsadfsdafsdafsafdsfsda', isFirstSocket)

  // Broadcast presence if this is the first connection for the user
  if (isFirstSocket) {
    // Update DB status to online
    db.update(users)
      .set({ status: 'online', lastSeen: new Date() })
      .where(eq(users.id, userId))
      .catch(err => logger.error("[ws] failed to update user online status:", err.message));

    broadcastToAll(
      {
        type: EVENTS.PRESENCE.ONLINE,
        userId,
        timestamp: new Date().toISOString(),
      },
      socketId,
    );
  }

  // Sync current presence state to the newly connected socket.
  // Without this, the UI will only learn about `user:online` when the other user reconnects.
  for (const onlineUserId of userSockets.keys()) {
    if (onlineUserId === userId) continue;
    sendJsonMessage(socket, {
      type: EVENTS.PRESENCE.ONLINE,
      userId: onlineUserId,
      timestamp: new Date().toISOString(),
    });
  }
};

const onDisconnect = (socket) => {
  const { socketId, userId } = socket;

  clients.delete(socketId);
  cleanupSubscriptions(socketId);

  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      userSockets.delete(userId);
      // Update DB status to offline and set lastSeen
      db.update(users)
        .set({ status: 'offline', lastSeen: new Date() })
        .where(eq(users.id, userId))
        .catch(err => logger.error("[ws] failed to update user offline status:", err.message));

      // Last socket closed, broadcast offline status
      broadcastToAll({
        type: EVENTS.PRESENCE.OFFLINE,
        userId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  logger.info(`[ws] disconnected socketId=${socketId} userId=${userId}`);
};

const onMessage = (socket, raw) => {
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch {
    return sendJsonMessage(socket, { type: "error", message: "Invalid JSON" });
  }

  const { type, room, chatId, ...data } = msg;

  switch (type) {
    case EVENTS.ROOM.JOIN:
    case "subscribe": // backward compatibility
      subscribe(socket.socketId, room || chatId);
      sendJsonMessage(socket, { type: EVENTS.ROOM.JOIN, room: room || chatId });
      break;

    case EVENTS.ROOM.LEAVE:
    case "unsubscribe": // backward compatibility
      unsubscribe(socket.socketId, room || chatId);
      sendJsonMessage(socket, {
        type: EVENTS.ROOM.LEAVE,
        room: room || chatId,
      });
      break;

    case EVENTS.PRESENCE.TYPING_START:
      broadcastToRoom(
        chatId || room,
        {
          type: EVENTS.PRESENCE.TYPING_START,
          userId: socket.userId,
          chatId: chatId || room,
        },
        socket.socketId,
      );
      break;

    case EVENTS.PRESENCE.TYPING_STOP:
      broadcastToRoom(
        chatId || room,
        {
          type: EVENTS.PRESENCE.TYPING_STOP,
          userId: socket.userId,
          chatId: chatId || room,
        },
        socket.socketId,
      );
      break;

    case EVENTS.PRESENCE.SYNC: {
      // Return a snapshot of current presence so remounted clients
      // do not rely only on live online/offline push events.
      const requestedUserId = data.userId;
      const onlineUserIds = Array.from(userSockets.keys());
      const isOnline = requestedUserId
        ? onlineUserIds.includes(String(requestedUserId))
        : null;

      sendJsonMessage(socket, {
        type: EVENTS.PRESENCE.SNAPSHOT,
        userId: requestedUserId ?? null,
        isOnline,
        onlineUserIds,
        timestamp: new Date().toISOString(),
      });
      break;
    }

    case EVENTS.MESSAGING.SEND:
      // Typically handled via REST API, but provided here for direct WS messaging
      // This would normally call a controller to save to DB then broadcast
      break;

    case "ping":
      sendJsonMessage(socket, { type: "pong" });
      break;

    default:
      if (type && type.startsWith("message:")) {
        // Generic broadcast for other messaging sub-events
        broadcastToRoom(
          chatId || room,
          { type, senderId: socket.userId, ...data },
          socket.socketId,
        );
      } else {
        sendJsonMessage(socket, {
          type: "error",
          message: `Unknown type: ${type}`,
        });
      }
  }
};

// ─── Heartbeat ────────────────────────────────────────────────────────────────

const startHeartbeat = (wss, intervalMs = 30_000) => {
  heartbeatInterval = setInterval(() => {
    for (const socket of wss.clients) {
      if (!socket.isAlive) return socket.terminate();
      socket.isAlive = false;
      socket.ping();
    }
  }, intervalMs);
};

// ─── Graceful shutdown ────────────────────────────────────────────────────────

const gracefulShutdown = (wss) => {
  logger.info("[ws] server shutting down...");
  clearInterval(heartbeatInterval);
  if (healthInterval) clearInterval(healthInterval);
  for (const socket of wss.clients) {
    sendJsonMessage(socket, { type: EVENTS.SYSTEM.SHUTDOWN });
    socket.close(1001, "Server shutting down");
  }
  wss.close(() => logger.info("[ws] server closed"));
};

// ─── Entry point ──────────────────────────────────────────────────────────────

const attachWebSocketServer = (server) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (socket, request) => {

    console.log("requesadfsadfsdfasst", request);
    const user = authenticate(request);
    if (!user) {
      socket.close(4001, "Unauthorized");
      return;
    }
    onConnect(socket, user.userId);
  });

  startHeartbeat(wss);

  process.on("SIGTERM", () => gracefulShutdown(wss));
  process.on("SIGINT", () => gracefulShutdown(wss));

  // Broadcast server health every minute
  healthInterval = setInterval(() => {
    const stats = {
      connections: clients.size,
      users: userSockets.size,
      rooms: rooms.size,
    };
    broadcastToAll({
      type: EVENTS.SYSTEM.HEALTH,
      status: "healthy",
      timestamp: new Date().toISOString(),
      stats,
    });
  }, 60_000);

  // Helper functions for external use (e.g. from controllers)
  const broadcastNewMessage = (userId, message) => {
    broadcastToUser(userId, {
      type: EVENTS.MESSAGING.RECEIVE,
      data: message,
    });
  };

  const broadcastNewGroupMessage = (room, message, excludeSocketId = null) => {
    broadcastToRoom(
      room,
      {
        type: EVENTS.MESSAGING.RECEIVE,
        data: message,
      },
      excludeSocketId,
    );
  };

  const broadcastMessageUpdate = (room, type, data, excludeSocketId = null) => {
    broadcastToRoom(room, { type, data }, excludeSocketId);
  };

  const broadcastSystemEvent = (type, data) => {
    broadcastToAll({ type, data });
  };

  return {
    EVENTS,
    broadcastToUser,
    broadcastToRoom,
    broadcastToAll,
    broadcastNewMessage,
    broadcastNewGroupMessage,
    broadcastMessageUpdate,
    broadcastSystemEvent,
    subscribe,
    unsubscribe,
    getStats: () => ({
      connections: clients.size,
      users: userSockets.size,
      rooms: rooms.size,
    }),
  };
};

export default attachWebSocketServer;
