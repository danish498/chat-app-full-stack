"use client";

import { userData, UserData, Message } from "@/app/data";
import React, { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Conversation } from "./conversation";
import useSWR, { mutate } from "swr";
import chatService, { Chat as ChatData } from "@/services/chat.service";
import authService, { User } from "@/services/auth.service";
import userService from "@/services/user.service";
import { Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import useSWRMutation from "swr/mutation";
import messageService from "@/services/message.service";
import { CreateGroupModal } from "./CreateGroupModal";
import { useWebSocket } from "@/hooks/useWebSocket";

interface ChatProps {
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

export function Chat({
  defaultLayout = [320, 480],
  defaultCollapsed = false,
  navCollapsedSize,
}: ChatProps) {
  const {
    data: chats,
    error,
    isLoading: chatLoading,
  } = useSWR("user-chats", chatService.getChats);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  console.log({ selectedUser });

  const {
    data: searchResults,
    isLoading: searchLoading,
    error: searchError,
  } = useSWR(
    debouncedSearchQuery ? ["search-users", debouncedSearchQuery] : null,
    () => userService.searchUsers(debouncedSearchQuery),
  );

  const {
    data: messagesData,
    isLoading: messageLoading,
    error: messageError,
  } = useSWR(selectedChatId ? ["messages", selectedChatId] : null, () =>
    messageService.getMessagesByChatId(selectedChatId!),
  );

  console.log({ selectedChatId });

  const {
    trigger,
    data: chatCreateData,
    error: createChatError,
    isMutating,
  } = useSWRMutation(
    "chat-create",
    async (
      url: string,
      {
        arg,
      }: {
        arg: {
          name?: string;
          type: "direct" | "group";
          participantIds: string[];
        };
      },
    ) => {
      return chatService.createChat(arg);
    },
  );

  console.log({ chatCreateData });






  const handleSelectedUser = async (user: UserData) => {
    setSelectedUser(user);

    const data = await trigger({
      name: "test",
      type: "direct",
      participantIds: [String(user.id)],
    });

    console.log("chat response", data);

    const chatId = data?.data?.id;
    console.log({ chatId });

    if (chatId) {
      setSelectedChatId(chatId);
    }
  };

  const handleSelectedChat = (chatId: string) => {
    setSelectedChatId(chatId);
    const chat = chats?.data?.find((c) => c.id === chatId);
    if (chat) {
      setSelectedUser({
        id: chat.type === "direct" ? chat.otherUser.id : chat.id,
        name:
          chat.type === "direct"
            ? chat.otherUser.username
            : (chat.name ?? "Group"),
        avatar:
          chat.type === "direct"
            ? chat.otherUser.avatarUrl ||
            "https://avatars.githubusercontent.com/u/79553845"
            : (chat.avatarUrl ??
              "https://avatars.githubusercontent.com/u/79553845"),
        messages: [],
      } as any);
    }
  };

  const links =
    chats?.data?.map((chat) => {
      const name =
        chat.type === "direct"
          ? (chat.otherUser?.displayName || chat.otherUser?.username)
          : (chat.name ?? "Group");
      return {
        id: chat.id,
        name: name,
        messages: chat.lastMessage ? [chat.lastMessage] : [] as Message[],
        avatar:
          chat.type === "direct"
            ? (chat.otherUser?.avatarUrl || "https://avatars.githubusercontent.com/u/79553845")
            : (chat.avatarUrl ??
              "https://avatars.githubusercontent.com/u/79553845"),
        variant: (selectedUser?.id === (chat.type === "direct" ? chat.otherUser?.id : chat.id) ? "grey" : "ghost") as
          | "grey"
          | "ghost",
        type: chat.type,
      };
    }) || [];

  const handleChatSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleCreateGroup = async (name: string, participantIds: string[]) => {
    try {
      const data = await trigger({
        name,
        type: "group",
        participantIds,
      });

      console.log("group create response", data);

      // Refresh the chat list
      mutate("user-chats");

      if (data?.data?.id) {
        handleSelectedChat(data.data.id);
      }
    } catch (err) {
      console.error("Failed to create group", err);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // if (!mobile && !selectedUser) {
      //   setSelectedUser(userData[0]);
      // }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { data: currentUser } = useSWR("current-user", () => authService.getProfile());

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar - Hidden on mobile if a user is selected */}
      <div
        className={cn(
          "h-full border-r transition-all duration-300 ease-in-out",
          isMobile
            ? selectedUser
              ? "hidden"
              : "w-full"
            : "w-[480px]  max-w-[520px]",
        )}
      >
        {chatLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Sidebar
            selectedUser={selectedUser}
            onSelectChat={(chatId) => handleSelectedChat(chatId)}
            onSelectUser={(user) => handleSelectedUser(user)}
            links={links}
            onSearch={handleChatSearch}
            searchResults={searchResults?.data}
            searchLoading={searchLoading}
            searchPerformed={!!debouncedSearchQuery}
            onCreateGroupClick={() => setIsGroupModalOpen(true)}
            currentUser={currentUser}
          />
        )}
      </div>

      {/* Main Chat Area - Hidden on mobile if no user is selected */}
      <div
        className={cn(
          "flex-1 h-full",
          isMobile ? (!selectedUser ? "hidden" : "w-full") : "block",
        )}
      >
        {selectedUser ? (
          messageLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Conversation
              chatId={selectedChatId}
              messages={messagesData?.data}
              selectedUser={selectedUser}
              chatType={chats?.data?.find(c => c.id === selectedChatId)?.type}
              isLoading={messageLoading}
              onBack={isMobile ? () => setSelectedUser(null) : undefined}
            />
          )
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/20">
            <div className="flex flex-col items-center gap-4">
              <p className="text-lg">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>

      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
        isSubmitting={isMutating}
      />
    </div>
  );
}
