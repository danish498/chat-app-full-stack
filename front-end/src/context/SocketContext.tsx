"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { socketService } from "@/lib/socket";

interface SocketContextType {
  isConnected: boolean;
  onlineUsers: Set<string>;
  isUserOnline: (userId: string) => boolean;
  initializeSocket: (userId: string) => void;
  sendMessage: (recipientId: string, message: any, chatId: number) => void;
  sendTypingStatus: (chatId: number, userId: string, isTyping: boolean) => void;
  onNewMessage: (callback: (message: any) => void) => void;
  offNewMessage: (callback: (message: any) => void) => void;
  onUserTyping: (callback: (data: any) => void) => void;
  offUserTyping: (callback: (data: any) => void) => void;
  onUserStatusUpdate: (callback: (data: any) => void) => void;
  offUserStatusUpdate: (callback: (data: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const initializeSocket = (userId: string) => {
    socketService.connect(userId);
    setIsConnected(socketService.isConnected());
  };

  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.has(userId.toString());
  };

  useEffect(() => {
    // Get user data from localStorage on mount
    const userData = localStorage.getItem("user");

    if (userData) {
      try {
        const user = JSON.parse(userData);
        const userId = user.user_id || user.id;

        if (userId) {
          socketService.connect(userId.toString());

          // Check connection status after a short delay
          setTimeout(() => {
            setIsConnected(socketService.isConnected());
          }, 1000);
        } else {
          console.error("❌ No userId found in user data");
        }
      } catch (error) {
        console.error("❌ Error parsing user data:", error);
      }
    } else {
      console.warn("⚠️ No user data in localStorage - socket will not connect");
      console.warn("💡 Call initializeSocket(userId) after login to connect");
    }

    // Listen for user status updates
    const handleUserStatusUpdate = (data: { userId: string; status: string }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        if (data.status === "online") {
          newSet.add(data.userId.toString());
        } else if (data.status === "offline") {
          newSet.delete(data.userId.toString());
        }
        return newSet;
      });
    };

    // Listen for initial online users list
    const handleOnlineUsers = (usersList: string[]) => {
      setOnlineUsers(new Set(usersList.map(id => id.toString())));
    };

    socketService.on("onlineUsers", handleOnlineUsers);
    socketService.on("userStatusUpdate", handleUserStatusUpdate);

    // Cleanup on unmount
    return () => {
      socketService.off("onlineUsers", handleOnlineUsers);
      socketService.off("userStatusUpdate", handleUserStatusUpdate);
      socketService.disconnect();
      setIsConnected(false);
    };
  }, []);

  const sendMessage = (recipientId: string, message: any, chatId: number) => {
    socketService.sendMessage(recipientId, message, chatId);
  };

  const sendTypingStatus = (
    chatId: number,
    userId: string,
    isTyping: boolean
  ) => {
    socketService.sendTypingStatus(chatId, userId, isTyping);
  };

  const onNewMessage = (callback: (message: any) => void) => {
    socketService.on("newMessage", callback);
  };

  const offNewMessage = (callback: (message: any) => void) => {
    socketService.off("newMessage", callback);
  };

  const onUserTyping = (callback: (data: any) => void) => {
    socketService.on("userTyping", callback);
  };

  const offUserTyping = (callback: (data: any) => void) => {
    socketService.off("userTyping", callback);
  };

  const onUserStatusUpdate = (callback: (data: any) => void) => {
    socketService.on("userStatusUpdate", callback);
  };

  const offUserStatusUpdate = (callback: (data: any) => void) => {
    socketService.off("userStatusUpdate", callback);
  };

  const value: SocketContextType = {
    isConnected,
    onlineUsers,
    isUserOnline,
    initializeSocket,
    sendMessage,
    sendTypingStatus,
    onNewMessage,
    offNewMessage,
    onUserTyping,
    offUserTyping,
    onUserStatusUpdate,
    offUserStatusUpdate,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
