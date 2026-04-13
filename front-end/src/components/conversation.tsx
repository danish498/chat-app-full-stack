import { Message, UserData } from "@/app/data";
import MessageTopbar from "./message-topbar";
import { MessageList } from "./messasge-list";
import React, { useEffect, useRef } from "react";
import { MessageSkeleton } from "./message-skeleton";
import MessageBottombar from "./message-bottombar";
import messageService from "@/services/message.service";
import { useSWRConfig } from "swr";

interface ConversationProps {
  chatId: string | null;
  messages?: Message[];
  selectedUser: UserData;
  onBack?: () => void;
  isLoading?: boolean;
}

export function Conversation({
  chatId,
  messages,
  selectedUser,
  onBack,
  isLoading,
}: ConversationProps) {
  const { mutate } = useSWRConfig();
  const sequenceRef = useRef<number>(0);

  const [messagesState, setMessages] = React.useState<Message[]>(() => {
    return messages ?? [];
  });

  useEffect(() => {
    // setMessages(messages ?? []);

    if (chatId) {
      setMessages(messages ?? []);
    }

  }, [chatId]);

  const sendMessage = async (content: string) => {
    if (!chatId) return;

    const optimisticId = `temp-${Date.now()}`;

    const optimisticMessage: Message = {
      id: optimisticId,
      content,
      chatId,
      isMe: true,
      createdAt: new Date().toISOString(),
    } as Message;

    // ✅ 1. Show instantly
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await messageService.sendMessage({
        chatId,
        content,
        messageType: "text",
        createdAt: optimisticMessage.createdAt,
      });

      if (response.success) {
        const realMessage = { ...response.data, isMe: true };



        // optional revalidate (not required immediately)
        mutate(["messages", chatId], undefined, { revalidate: false });
      }
    } catch (error) {
      console.error("Failed to send message:", error);

      // ❌ 3. Rollback if failed
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== optimisticId)
      );
    }
  };

  return (
    <div className="flex flex-col justify-between w-full h-full bg-background/50 backdrop-blur-sm">
      <MessageTopbar selectedUser={selectedUser} onBack={onBack} />

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <MessageSkeleton />
        ) : (
          <MessageList messages={messagesState} selectedUser={selectedUser} />
        )}
      </div>

      <div className="p-4 border-t bg-background/80 backdrop-blur-md">
        <MessageBottombar sendMessage={sendMessage} />
      </div>
    </div>
  );
}