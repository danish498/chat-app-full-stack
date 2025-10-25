import { Message, UserData } from "@/app/data";
import { cn } from "@/lib/utils";
import React, { useRef } from "react";
import { Avatar, AvatarImage } from "../ui/avatar";
import ChatBottombar from "./chat-bottombar";
import { AnimatePresence, motion } from "framer-motion";

export interface MessageData {
  message_id: number;
  chat_id: number;
  sender_id: number;
  message: string;
  seen: boolean;
  created_at: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    user_id: number;
    username: string;
    email: string;
  };
  chats: {
    user_id: number;
    recipient_id: number;
    user: {
      user_id: number;
      username: string;
    };
    recipientId: {
      user_id: number;
      username: string;
    };
  };

  alignment: string;
  isOwnMessage: boolean;
  messageType: string;
}

interface ChatListProps {
  messages?: MessageData[];
  selectedUser: any;
  sendMessage: (newMessage: Message) => void;
  isMobile: boolean;
  currentUserId?: number;
}

export function ChatList({
  messages,
  selectedUser,
  sendMessage,
  isMobile,
}: ChatListProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const renderOriginalMessages = () => {
    return messages?.map((message, index) => {
      const isCurrentUser = message.isOwnMessage;
      const senderUsername = message.sender.username;

      return (
        <motion.div
          key={`json-${message.message_id}`}
          layout
          style={{
            originX: 0.5,
            originY: 0.5,
          }}
          className={cn(
            "flex flex-col gap-2 p-4 whitespace-pre-wrap",
            isCurrentUser ? "items-end" : "items-start"
          )}
        >
          <div className="flex gap-3 items-center">
            {!isCurrentUser && (
              <Avatar className="flex justify-center items-center">
                <AvatarImage
                  src={`https://api.dicebear.com/6.x/initials/svg?seed=${senderUsername}`}
                  alt={senderUsername}
                  width={6}
                  height={6}
                />
              </Avatar>
            )}
            <div className="flex flex-col">
              <span
                className={cn(
                  "p-3 rounded-md max-w-xs break-words",
                  isCurrentUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent"
                )}
              >
                {message.message}
              </span>
              <span className="text-xs text-muted-foreground mt-1 px-1">
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {isCurrentUser && (
              <Avatar className="flex justify-center items-center">
                <AvatarImage
                  src={`https://api.dicebear.com/6.x/initials/svg?seed=${senderUsername}`}
                  alt={senderUsername}
                  width={6}
                  height={6}
                />
              </Avatar>
            )}
          </div>
        </motion.div>
      );
    });
  };

  return (
    <>
      <div
        ref={messagesContainerRef}
        className="w-full overflow-y-auto overflow-x-hidden flex-1"
      >
        <AnimatePresence>
          {messages && renderOriginalMessages()}
        </AnimatePresence>
      </div>
      <ChatBottombar
        sendMessage={sendMessage}
        isMobile={isMobile}
        selectedUser={selectedUser}
      />
    </>
  );
}
