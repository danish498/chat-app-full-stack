// In a separate file called socket.js
const socketIO = require("socket.io");
let io;

// Map to store online users - maps userId to socketId
const onlineUsers = new Map();

// Initialize the socket server
const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    // When a user goes online, store their userId and socketId
    socket.on("userOnline", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log(`User ${userId} is online with socket ${socket.id}`);
      // Notify other users that this user is online
      io.emit("userStatusUpdate", { userId, status: "online" });
    });

    // Handle chat messages
    socket.on("chatMessage", (data) => {
      const { recipientId, message, chat_id } = data;
      // Emit to specific user if they're online
      if (onlineUsers.has(recipientId)) {
        io.to(onlineUsers.get(recipientId)).emit("newMessage", message);
      }
    });

    // Handle typing indicator
    socket.on("typing", (data) => {
      const { chatId, userId, isTyping } = data;
      socket.broadcast.emit("userTyping", { chatId, userId, isTyping });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      // Find and remove the user from onlineUsers
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          io.emit("userStatusUpdate", { userId, status: "offline" });
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
      console.log("Client disconnected");
    });
  });

  return io;
};

// Function to emit socket events to specific users
const emitSocketEvent = (req, userId, event, data) => {
  if (onlineUsers.has(userId)) {
    io.to(onlineUsers.get(userId)).emit(event, data);
  }
};

module.exports = { initializeSocket, emitSocketEvent };
