import { Message, UserData } from "@/app/data";
import MessageTopbar from "./message-topbar";
import { MessageList } from "./messasge-list";
import React, { useEffect } from "react";
import { MessageSkeleton } from "./message-skeleton";
import MessageBottombar from "./message-bottombar";
import messageService from "@/services/message.service";
import { useSWRConfig } from "swr";
import {
  encryptMessage,
  decryptMessage,
  getOrCreateDeviceId,
} from "@/lib/e2ee";
import { apiFetch } from "@/lib/apiClient";
import authService from "@/services/auth.service";
import { useWebSocket } from "@/hooks/useWebSocket";
import { WS_EVENTS } from "@/constants/constants";

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

export const Conversation = React.memo(function Conversation({
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
  const [isOnline, setIsOnline] = React.useState(false);
  const [lastSeenOverride, setLastSeenOverride] = React.useState<string | null>(
    null,
  );
  const [isOtherTyping, setIsOtherTyping] = React.useState(false);

  const [messagesState, setMessages] = React.useState<Message[]>([]);
  const [isDecrypting, setIsDecrypting] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);
  const selectedUserId = String(selectedUser.id);

  const isSelectedUser = React.useCallback(
    (id: string | number | undefined | null) => String(id) === selectedUserId,
    [selectedUserId],
  );

  const decryptBatch = React.useCallback(
    async (batch: Message[]) => {
      if (!batch.length) return batch;

      const currentUser = authService.getCurrentUser();
      if (!currentUser) return batch;

      if (chatType !== "direct") return batch;

      const decrypted = await Promise.all(
        batch.map(async (msg) => {
          // Check if message is encrypted (either by flag or presence of payloads)
          if (msg.encryptedPayloads || !msg.isEncrypted) {
            try {
              const plaintext = await decryptMessage({
                message: msg as any,
                recipientUserId: String(currentUser.id),
                senderUserId: String(msg.senderId),
                apiFetch,
              });
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
    [chatType],
  );

  const handleWsMessage = React.useCallback(
    async (msg: any) => {
      if (!msg?.type) return;

      // Messages
      if (msg.type === "message:receive") {
        const incoming = msg.data;
        if (!incoming) return;

        if (incoming.chatId !== chatId) return;

        try {
          const [decrypted] = await decryptBatch([incoming]);
          const currentUser = authService.getCurrentUser();
          const isMe = currentUser
            ? decrypted.senderId === currentUser.id
            : false;

          const currentDeviceId = getOrCreateDeviceId();
          if (decrypted.senderDeviceId === currentDeviceId) return;

          const finalized: Message = { ...decrypted, isMe };

          setMessages((prev) => {
            const byIdIndex = finalized.id
              ? prev.findIndex((m) => m.id === finalized.id)
              : -1;
            if (byIdIndex >= 0) {
              const copy = [...prev];
              copy[byIdIndex] = finalized;
              return copy;
            }

            const tempIndex = prev.findIndex(
              (m) =>
                m.id?.startsWith("temp-") &&
                ((m.createdAt &&
                  finalized.createdAt &&
                  m.createdAt === finalized.createdAt) ||
                  (m.content === finalized.content &&
                    m.messageType === finalized.messageType &&
                    m.fileUrl === finalized.fileUrl)),
            );

            if (tempIndex >= 0) {
              const copy = [...prev];
              copy[tempIndex] = { ...finalized, id: finalized.id };
              return copy;
            }

            return [...prev, finalized];
          });

          mutate("user-chats");
        } catch (err) {
          console.error("Failed to handle WS incoming message:", err);
        }
      }

      if (msg.type === "user:online") {
        // Chat type gating happens elsewhere; presence should work even if chatType
        // is still being resolved on initial render.
        if (isSelectedUser(msg.userId)) setIsOnline(true);
      }

      if (msg.type === "user:offline") {
        if (isSelectedUser(msg.userId)) {
          setIsOnline(false);
          setLastSeenOverride(new Date().toISOString());
        }
      }

      if (msg.type === WS_EVENTS.PRESENCE_SNAPSHOT) {
        const requestedUserId = msg.userId;
        if (!requestedUserId) return;
        if (!isSelectedUser(requestedUserId)) return;

        const onlineFromSnapshot =
          typeof msg.isOnline === "boolean"
            ? msg.isOnline
            : Array.isArray(msg.onlineUserIds) &&
              msg.onlineUserIds.some((id: string) => isSelectedUser(id));

        setIsOnline(Boolean(onlineFromSnapshot));
        if (!onlineFromSnapshot) {
          setLastSeenOverride((prev) => prev ?? new Date().toISOString());
        }
      }

      // Typing (direct chats only)
      if (chatType !== "direct") return;

      if (msg.type === "typing:start") {
        const otherTypingUserId = msg.userId;
        const otherChatId = msg.chatId;
        if (!chatId) return;
        if (otherChatId !== chatId) return;
        if (isSelectedUser(otherTypingUserId)) setIsOtherTyping(true);
      }

      if (msg.type === "typing:stop") {
        const otherTypingUserId = msg.userId;
        const otherChatId = msg.chatId;
        if (!chatId) return;
        if (otherChatId !== chatId) return;
        if (isSelectedUser(otherTypingUserId)) setIsOtherTyping(false);
      }
    },
    [chatId, chatType, isSelectedUser, decryptBatch, mutate],
  );

  const { status: wsStatus, sendMessage: wsSendMessage } =
    useWebSocket(handleWsMessage);

  const emitTypingStart = React.useCallback(() => {
    if (!chatId) return;
    wsSendMessage("typing:start", { chatId });
  }, [chatId, wsSendMessage]);

  const emitTypingStop = React.useCallback(() => {
    if (!chatId) return;
    wsSendMessage("typing:stop", { chatId });
  }, [chatId, wsSendMessage]);

  // Join the WS room for this chat and leave it on cleanup.
  useEffect(() => {
    if (!chatId) return;
    if (wsStatus !== "connected") return;

    wsSendMessage("room:join", { room: chatId });

    return () => {
      // Make sure typing doesn't get "stuck" for other users.
      wsSendMessage("typing:stop", { chatId });
      wsSendMessage("room:leave", { room: chatId });
      setIsOtherTyping(false);
    };
  }, [chatId, wsStatus, wsSendMessage]);

  // Reset presence/typing when switching chats.
  useEffect(() => {
    setIsOtherTyping(false);
    setIsOnline(false);
    setLastSeenOverride(null);
  }, [chatId, chatType, selectedUser.id]);

  useEffect(() => {
    if (chatType !== "direct") return;
    if (wsStatus !== "connected") return;
    if (!selectedUser?.id) return;

    const requestPresenceSnapshot = () => {
      wsSendMessage(WS_EVENTS.PRESENCE_SYNC, {
        userId: String(selectedUser.id),
      });
    };

    requestPresenceSnapshot();

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        requestPresenceSnapshot();
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [chatType, wsStatus, selectedUser?.id, wsSendMessage]);

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
  }, [chatId, decryptBatch]);

  const loadOlder = React.useCallback(async () => {
    if (!chatId) return;
    if (!nextCursor || !hasMore) return;
    if (isLoadingMore) return;

    const el = listRef.current;
    const prevScrollHeight = el?.scrollHeight ?? 0;
    const prevScrollTop = el?.scrollTop ?? 0;

    setIsLoadingMore(true);
    try {
      const res = await messageService.getMessagesByChatId(
        chatId,
        nextCursor,
        15,
      );
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
      replyToId?: string | null;
    },
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
      replyToId: options?.replyToId ?? null,
    } as Message;

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const currentUser = authService.getCurrentUser();

      if (!currentUser) throw new Error("User not authenticated");

      let messageToSend: any = {
        chatId,
        messageType: resolvedType,
        fileUrl: options?.fileUrl ?? null,
        replyToId: options?.replyToId ?? null,
        createdAt: optimisticMessage.createdAt,
      };

      // Only encrypt text messages in direct chats (media URLs are public CDN links)
      if (chatType === "direct" && resolvedType === "text") {
        const { encryptedPayloads } = await encryptMessage({
          plaintext: content,
          senderUserId: String(currentUser.id),
          participantUserIds: [String(currentUser.id), String(selectedUser.id)],
          apiFetch,
        });

        messageToSend.encryptedPayloads = encryptedPayloads;
      } else {
        messageToSend.content = content;
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
      <MessageTopbar
        selectedUser={
          {
            ...selectedUser,
            lastSeen: lastSeenOverride || selectedUser.lastSeen,
          } as any
        }
        onBack={onBack}
        onUserClick={onUserClick}
        isTyping={isOtherTyping}
        isOnline={isOnline}
      />

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
        <MessageBottombar
          sendMessage={sendMessage}
          onTypingStart={emitTypingStart}
          onTypingStop={emitTypingStop}
        />
      </div>
    </div>
  );
});
