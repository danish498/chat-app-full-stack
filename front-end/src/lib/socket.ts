import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:9090";

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(userId: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      // Register user as online
      this.socket?.emit("userOnline", userId);
    });

    this.socket.on("disconnect", () => {});

    this.socket.on("connect_error", (error) => {
      console.error("🔴 Socket connection error:", error.message);
      console.error("🔴 Make sure backend is running on:", SOCKET_URL);
    });

    // Set up online users list listener
    this.socket.on("onlineUsers", (usersList) => {
      this.triggerListeners("onlineUsers", usersList);
    });

    // Set up message listener
    this.socket.on("newMessage", (message) => {
      this.triggerListeners("newMessage", message);
    });

    // Set up typing listener
    this.socket.on("userTyping", (data) => {
      this.triggerListeners("userTyping", data);
    });

    // Set up user status listener
    this.socket.on("userStatusUpdate", (data) => {
      this.triggerListeners("userStatusUpdate", data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  sendMessage(recipientId: string, message: any, chatId: number) {
    if (this.socket?.connected) {
      this.socket.emit("chatMessage", {
        recipientId,
        message,
        chat_id: chatId,
      });
    } else {
      console.error("❌ Socket not connected. Cannot send message.");
      console.error("🔍 Socket state:", {
        exists: !!this.socket,
        connected: this.socket?.connected,
        socketUrl: SOCKET_URL,
      });
    }
  }

  sendTypingStatus(chatId: number, userId: string, isTyping: boolean) {
    if (this.socket?.connected) {
      this.socket.emit("typing", {
        chatId,
        userId,
        isTyping,
      });
    }
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private triggerListeners(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data));
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
