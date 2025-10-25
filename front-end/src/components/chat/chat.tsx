import { Message, UserData } from "@/app/data";
import ChatTopbar from "./chat-topbar";
import { ChatList, MessageData } from "./chat-list";
import React, { useEffect, useCallback } from "react";
import { ChevronLeft, MoveLeft } from "lucide-react";
import { MessageService } from "@/service/messageService";
import { useSocket } from "@/context/SocketContext";

interface ChatProps {
  messages?: MessageData[];
  selectedUser: UserData;
  toggleSidebarAndChat: boolean;
  isMobile: boolean;
  handleToggleSidebar?: () => void;
  setMessage?: any;
}

export function Chat({
  messages,
  selectedUser,
  isMobile,
  handleToggleSidebar,
  toggleSidebarAndChat,
  setMessage,
}: any) {
  const messageService = new MessageService();
  const {
    sendMessage: sendSocketMessage,
    onNewMessage,
    offNewMessage,
  } = useSocket();

  const getCurrentUserId = () => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      return user.user_id || user.id;
    }
    return null;
  };

  const handleNewMessage = useCallback(
    (newMessage: any) => {
      if (newMessage.chat_id === selectedUser.chatId) {
        setMessage((prevMessages: MessageData[]) => {
          const messageExists = prevMessages.some(
            (msg) => msg.message_id === newMessage.message_id
          );
          if (!messageExists) {
            const currentUserId = getCurrentUserId();
            const messageWithAlignment = {
              ...newMessage,
              isOwnMessage: newMessage.sender_id === currentUserId,
            };
            return [...prevMessages, messageWithAlignment];
          }
          return prevMessages;
        });
      }
    },
    [selectedUser.chatId, setMessage]
  );

  useEffect(() => {
    onNewMessage(handleNewMessage);

    return () => {
      offNewMessage(handleNewMessage);
    };
  }, [handleNewMessage, onNewMessage, offNewMessage]);

  const sendMessage = async (newMessage: Message) => {
    try {
      const response = await messageService.sendMessage(
        selectedUser.chatId,
        newMessage.message
      );

      const currentUserId = getCurrentUserId();
      const messageWithAlignment = {
        ...response.data.message,
        isOwnMessage: true,
      };

      setMessage((prevMessage: MessageData[]) => [
        ...prevMessage,
        messageWithAlignment,
      ]);

      if (selectedUser.recipientUsers?.user_id) {
        sendSocketMessage(
          selectedUser.recipientUsers.user_id.toString(),
          response.data.message,
          selectedUser.chatId
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex flex-col w-full max-h-screen h-full">
      <div className="flex justify-center items-center border-b">
        {isMobile && (
          <MoveLeft
            size={26}
            className="ml-2 cursor-pointer"
            onClick={handleToggleSidebar}
          />
        )}
        <ChatTopbar selectedUser={selectedUser} />
      </div>

      <ChatList
        messages={messages}
        selectedUser={selectedUser}
        sendMessage={sendMessage}
        isMobile={isMobile}
      />
    </div>
  );
}
