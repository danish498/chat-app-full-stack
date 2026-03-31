import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';

// ─── State ───────────────────────────────────────────────────────────────────

const clients    = new Map();           // socketId  → socket
const userSockets = new Map();          // userId    → Set<socketId>
const rooms      = new Map();           // roomName  → Set<socketId>
let heartbeatInterval = null;

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
        console.error('[ws] sendJsonMessage failed:', err.message);
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
    // Replace with real token validation (JWT, session, etc.)
    // Return { userId } or null to reject.
    const url = new URL(request.url, 'http://localhost');
    const userId = url.searchParams.get('userId');
    return userId ? { userId } : null;
};

const onConnect = (socket, userId) => {
    const socketId = randomUUID();
    socket.socketId = socketId;
    socket.userId   = userId;
    socket.isAlive  = true;

    clients.set(socketId, socket);

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socketId);

    socket.on('pong', () => { socket.isAlive = true; });

    socket.on('message', (raw) => onMessage(socket, raw));

    socket.on('close', () => onDisconnect(socket));

    socket.on('error', (err) => {
        console.error(`[ws] socket error (${socketId}):`, err.message);
    });

    sendJsonMessage(socket, { type: 'connected', socketId });
    console.log(`[ws] connected  socketId=${socketId} userId=${userId}`);
};

const onDisconnect = (socket) => {
    const { socketId, userId } = socket;

    clients.delete(socketId);
    cleanupSubscriptions(socketId);

    const sockets = userSockets.get(userId);
    if (sockets) {
        sockets.delete(socketId);
        if (sockets.size === 0) userSockets.delete(userId);
    }

    console.log(`[ws] disconnected socketId=${socketId} userId=${userId}`);
};

const onMessage = (socket, raw) => {
    let msg;
    try {
        msg = JSON.parse(raw);
    } catch {
        return sendJsonMessage(socket, { type: 'error', message: 'Invalid JSON' });
    }

    switch (msg.type) {
        case 'subscribe':
            subscribe(socket.socketId, msg.room);
            sendJsonMessage(socket, { type: 'subscribed', room: msg.room });
            break;

        case 'unsubscribe':
            unsubscribe(socket.socketId, msg.room);
            sendJsonMessage(socket, { type: 'unsubscribed', room: msg.room });
            break;

        case 'ping':
            sendJsonMessage(socket, { type: 'pong' });
            break;

        default:
            sendJsonMessage(socket, { type: 'error', message: `Unknown type: ${msg.type}` });
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
    clearInterval(heartbeatInterval);
    for (const socket of wss.clients) {
        sendJsonMessage(socket, { type: 'server_shutdown' });
        socket.close(1001, 'Server shutting down');
    }
    wss.close(() => console.log('[ws] server closed'));
};

// ─── Entry point ──────────────────────────────────────────────────────────────

const attachWebSocketServer = (server) => {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (socket, request) => {
        const user = authenticate(request);
        if (!user) {
            socket.close(4001, 'Unauthorized');
            return;
        }
        onConnect(socket, user.userId);
    });

    startHeartbeat(wss);

    process.on('SIGTERM', () => gracefulShutdown(wss));
    process.on('SIGINT',  () => gracefulShutdown(wss));

    return {
        broadcastToUser,
        broadcastToRoom,
        broadcastToAll,
        subscribe,
        unsubscribe,
        getStats: () => ({
            connections: clients.size,
            users:       userSockets.size,
            rooms:       rooms.size,
        }),
    };
};

export default attachWebSocketServer;