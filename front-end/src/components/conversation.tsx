import { Message, UserData } from "@/app/data";
import MessageTopbar from "./message-topbar";
import { MessageList } from "./messasge-list";
import React, { useEffect, useRef } from "react";
import { MessageSkeleton } from "./message-skeleton";
import MessageBottombar from "./message-bottombar";
import messageService from "@/services/message.service";
import { useSWRConfig } from "swr";
import { encryptMessage, decryptMessage } from "@/lib/e2ee";
import { apiFetch } from "@/lib/apiClient";
import authService from "@/services/auth.service";

interface ConversationProps {
  chatId: string | null;
  messages?: Message[];
  selectedUser: UserData;
  chatType?: 'direct' | 'group';
  onBack?: () => void;
  isLoading?: boolean;
}

export function Conversation({
  chatId,
  messages,
  selectedUser,
  chatType,
  onBack,
  isLoading,
}: ConversationProps) {
  const { mutate } = useSWRConfig();
  const sequenceRef = useRef<number>(0);

  const [messagesState, setMessages] = React.useState<Message[]>([]);
  const [isDecrypting, setIsDecrypting] = React.useState(false);

  useEffect(() => {
    let isCancelled = false;

    const decryptMessages = async () => {
      if (!messages || messages.length === 0) {
        setMessages([]);
        return;
      }

      setIsDecrypting(true);

      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        setIsDecrypting(false);
        return;
      }

      try {
        const decryptedMessages = await Promise.all(
          messages.map(async (msg) => {
            if (chatType === 'direct' && msg.isEncrypted && msg.content) {
              try {
                const plaintext = await decryptMessage(
                  msg as any,
                  currentUser.id,
                  selectedUser.id,
                  apiFetch
                );
                return { ...msg, content: plaintext };
              } catch (err) {
                console.error("Failed to decrypt message:", msg.id, err);
                return { ...msg, content: "[Decryption Failed]" };
              }
            }
            return msg;
          })
        );

        if (!isCancelled) {
          setMessages(decryptedMessages);
          setIsDecrypting(false);
        }
      } catch (error) {
        console.error("Decryption batch error:", error);
        if (!isCancelled) setIsDecrypting(false);
      }
    };

    if (chatId) {
      decryptMessages();
    }

    return () => {
      isCancelled = true;
    };
  }, [chatId, messages, selectedUser.id, chatType]);

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
      const currentUser = authService.getCurrentUser();


      if (!currentUser) throw new Error("User not authenticated");

      let messageToSend: any = {
        chatId,
        content,
        messageType: "text",
        createdAt: optimisticMessage.createdAt,
      };



      // Only encrypt for direct chats
      if (chatType === 'direct') {
        const { content: encryptedContent, nonce, isEncrypted } = await encryptMessage(
          content,
          currentUser.id,
          selectedUser.id,
          apiFetch
        );




        messageToSend.content = encryptedContent;
        messageToSend.nonce = nonce;
        messageToSend.isEncrypted = isEncrypted;
      }

      const response = await messageService.sendMessage(messageToSend);

      if (response.success) {
        // We keep the optimistic message in the UI, but we could update it with the real ID
        // Note: The real message from server will have ciphertext, 
        // but we want to keep showing the plaintext optimistically.
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
        {(isLoading || isDecrypting || !chatId) ? (
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