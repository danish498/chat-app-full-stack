import { Message, UserData } from "@/app/data";
import MessageTopbar from "./message-topbar";
import { MessageList } from "./messasge-list";
import React, { useEffect } from "react";
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
  initialNextCursor?: string | null;
  selectedUser: UserData;
  chatType?: "direct" | "group";
  onBack?: () => void;
  isLoading?: boolean;
  onUserClick?: () => void;
}

export function Conversation({
  chatId,
  messages,
  initialNextCursor,
  selectedUser,
  chatType,
  onBack,
  isLoading,
  onUserClick,
}: ConversationProps) {
  const { mutate } = useSWRConfig();
  const [messagesState, setMessages] = React.useState<Message[]>([]);
  const [isDecrypting, setIsDecrypting] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);

  const decryptBatch = React.useCallback(
    async (batch: Message[]) => {
      if (!batch.length) return batch;

      const currentUser = authService.getCurrentUser();
      if (!currentUser) return batch;

      if (chatType !== "direct") return batch;

      const decrypted = await Promise.all(
        batch.map(async (msg) => {
          if (msg.isEncrypted && msg.content) {
            try {
              const plaintext = await decryptMessage(
                msg as any,
                currentUser.id,
                selectedUser.id,
                apiFetch,
              );
              return { ...msg, content: plaintext };
            } catch (err) {
              console.error("Failed to decrypt message:", msg.id, err);
              return { ...msg, content: "[Decryption Failed]" };
            }
          }
          return msg;
        }),
      );
      return decrypted;
    },
    [chatType, selectedUser.id],
  );

  useEffect(() => {
    let isCancelled = false;

    const hydrate = async () => {
      if (!chatId || !messages || messages.length === 0) {
        setMessages([]);
        setNextCursor(null);
        setHasMore(false);
        return;
      }

      setIsDecrypting(true);
      try {
        const decrypted = await decryptBatch(messages);
        if (isCancelled) return;
        setMessages(decrypted);
        setNextCursor(initialNextCursor ?? null);
        setHasMore(!!initialNextCursor);
      } catch (error) {
        console.error("Decryption batch error:", error);
      } finally {
        if (!isCancelled) setIsDecrypting(false);
      }
    };

    hydrate();

    return () => {
      isCancelled = true;
    };
  }, [chatId]);

  const loadOlder = React.useCallback(async () => {
    if (!chatId) return;
    if (!nextCursor || !hasMore) return;
    if (isLoadingMore) return;

    const el = listRef.current;
    const prevScrollHeight = el?.scrollHeight ?? 0;
    const prevScrollTop = el?.scrollTop ?? 0;

    setIsLoadingMore(true);
    try {
      const res = await messageService.getMessagesByChatId(chatId, nextCursor, 15);
      const batch = res.data ?? [];
      if (!batch.length) {
        setHasMore(false);
        setNextCursor(null);
        return;
      }

      const decrypted = await decryptBatch(batch);
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        const merged = [...decrypted.filter((m) => !seen.has(m.id)), ...prev];
        return merged;
      });

      const nc = (res as any).nextCursor ?? null;
      setNextCursor(nc);
      setHasMore(!!nc);

      // keep viewport anchored after prepending
      requestAnimationFrame(() => {
        const node = listRef.current;
        if (!node) return;
        const newScrollHeight = node.scrollHeight;
        const delta = newScrollHeight - prevScrollHeight;
        node.scrollTop = prevScrollTop + delta;
      });
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [chatId, nextCursor, hasMore, isLoadingMore, decryptBatch]);

  const sendMessage = async (
    content: string,
    options?: {
      fileUrl?: string;
      messageType?: "text" | "image" | "file" | "video";
    }
  ) => {
    if (!chatId) return;

    const optimisticId = `temp-${Date.now()}`;
    const resolvedType = options?.messageType ?? "text";

    const optimisticMessage: Message = {
      id: optimisticId,
      content,
      chatId,
      isMe: true,
      createdAt: new Date().toISOString(),
      messageType: resolvedType,
      fileUrl: options?.fileUrl ?? null,
    } as Message;

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const currentUser = authService.getCurrentUser();

      if (!currentUser) throw new Error("User not authenticated");

      let messageToSend: any = {
        chatId,
        content,
        messageType: resolvedType,
        fileUrl: options?.fileUrl ?? null,
        createdAt: optimisticMessage.createdAt,
      };

      // Only encrypt text messages in direct chats (media URLs are public CDN links)
      if (chatType === "direct" && resolvedType === "text") {
        const {
          content: encryptedContent,
          nonce,
          isEncrypted,
        } = await encryptMessage(
          content,
          currentUser.id,
          selectedUser.id,
          apiFetch,
        );

        messageToSend.content = encryptedContent;
        messageToSend.nonce = nonce;
        messageToSend.isEncrypted = isEncrypted;
      }

      const response = await messageService.sendMessage(messageToSend);

      if (response.success) {
        mutate(["messages", chatId], undefined, { revalidate: false });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-background/50 backdrop-blur-sm">
      <MessageTopbar selectedUser={selectedUser} onBack={onBack} onUserClick={onUserClick} />

      <div className="flex-1 min-h-0 overflow-hidden">
        {isLoading || isDecrypting || !chatId ? (
          <MessageSkeleton />
        ) : (
          <MessageList
            messages={messagesState}
            selectedUser={selectedUser}
            containerRef={listRef}
            isLoadingMore={isLoadingMore}
            onScroll={(e) => {
              const el = e.currentTarget;
              if (el.scrollTop < 120) {
                loadOlder();
              }
            }}
          />
        )}
      </div>

      <div className="p-4 border-t bg-background/80 backdrop-blur-md shrink-0">
        <MessageBottombar sendMessage={sendMessage} />
      </div>
    </div>
  );
}
