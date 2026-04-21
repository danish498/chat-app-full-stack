"use client";

import { UserData, Message } from "@/app/data";
import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const Sidebar = dynamic(() => import("./sidebar").then((mod) => mod.Sidebar), {
  loading: () => (
    <div className="flex items-center justify-center h-full w-full">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

const Conversation = dynamic(() => import("./conversation").then((mod) => mod.Conversation), {
  loading: () => (
    <div className="flex items-center justify-center h-full w-full">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});
import useSWR, { mutate } from "swr";
import chatService from "@/services/chat.service";
import authService from "@/services/auth.service";
import userService from "@/services/user.service";
import { Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import useSWRMutation from "swr/mutation";
import messageService from "@/services/message.service";
const CreateGroupModal = dynamic(() => import("./CreateGroupModal").then((mod) => mod.CreateGroupModal));

const ChatDetailsPanel = dynamic(() => import("./ChatDetailsPanel").then((mod) => mod.ChatDetailsPanel), {
  loading: () => (
    <div className="flex items-center justify-center h-full w-full">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

import { Sheet, SheetContent } from "./ui/sheet";

interface ChatProps {
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

const FALLBACK_AVATAR = "https://avatars.githubusercontent.com/u/79553845";

const toSidebarUser = (chat: any): UserData =>
  ({
    id: chat.type === "direct" ? chat.otherUser.id : chat.id,
    name:
      chat.type === "direct" ? chat.otherUser.username : (chat.name ?? "Group"),
    avatar:
      chat.type === "direct"
        ? (chat.otherUser.avatarUrl ?? FALLBACK_AVATAR)
        : (chat.avatarUrl ?? FALLBACK_AVATAR),
    messages: [],
    lastSeen: chat.type === "direct" ? chat.otherUser.lastSeen : null,
  }) as UserData;

export function Chat({
  defaultLayout: _defaultLayout = [320, 480],
  defaultCollapsed: _defaultCollapsed = false,
  navCollapsedSize: _navCollapsedSize,
}: ChatProps) {
  const { data: chats, isLoading: chatLoading } = useSWR(
    "user-chats",
    chatService.getChats,
  );

  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedChatIdForDetails, setSelectedChatIdForDetails] = useState<
    string | null
  >(null);

  const { data: selectedChat } = useSWR(
    selectedChatIdForDetails
      ? ["get-chat-by-id", selectedChatIdForDetails]
      : null,
    () => chatService.getChatById(selectedChatIdForDetails as string),
  );

  const { data: searchResults, isLoading: searchLoading } = useSWR(
    debouncedSearchQuery ? ["search-users", debouncedSearchQuery] : null,
    () => userService.searchUsers(debouncedSearchQuery),
  );

  const { data: messagesData, isLoading: messageLoading } = useSWR(
    selectedChatId ? ["messages", selectedChatId] : null,
    () => messageService.getMessagesByChatId(selectedChatId!),
  );

  const { trigger, isMutating } = useSWRMutation(
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

  const handleSelectedUser = async (user: UserData) => {
    setSelectedUser(user);

    const data = await trigger({
      name: "test",
      type: "direct",
      participantIds: [String(user.id)],
    });

    const chatId = data?.data?.id;

    if (chatId) {
      setSelectedChatId(chatId);
    }
  };

  const handleSelectedChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setSelectedChatIdForDetails(null);
    const chat = chats?.data?.find((c) => c.id === chatId);
    if (chat) {
      setSelectedUser(toSidebarUser(chat));
    }
  };

  const selectedChatType = useMemo(
    () => chats?.data?.find((c) => c.id === selectedChatId)?.type,
    [chats?.data, selectedChatId],
  );

  const links = useMemo(
    () =>
      chats?.data?.map((chat) => {
        const targetId = chat.type === "direct" ? chat.otherUser?.id : chat.id;
        const name =
          chat.type === "direct"
            ? chat.otherUser?.displayName || chat.otherUser?.username
            : (chat.name ?? "Group");
        return {
          id: chat.id,
          name,
          messages: chat.lastMessage ? [chat.lastMessage] : ([] as Message[]),
          avatar:
            chat.type === "direct"
              ? (chat.otherUser?.avatarUrl ?? FALLBACK_AVATAR)
              : (chat.avatarUrl ?? FALLBACK_AVATAR),
          variant: (selectedUser?.id === targetId ? "grey" : "ghost") as
            | "grey"
            | "ghost",
          type: chat.type,
          status: chat.type === "direct" ? chat.otherUser?.status : null,
          lastSeen: chat.type === "direct" ? chat.otherUser?.lastSeen : null,
        };
      }) || [],
    [chats?.data, selectedUser?.id],
  );

  const showSidebar = !isMobile || !selectedUser;
  const showConversation = !isMobile || !!selectedUser;

  const sidebarClassName = cn(
    "h-full border-r transition-all duration-300 ease-in-out",
    showSidebar ? (isMobile ? "w-full" : "w-[480px] max-w-[520px]") : "hidden",
  );

  const conversationClassName = cn(
    "flex-1 h-full",
    showConversation ? (isMobile ? "w-full" : "block") : "hidden",
  );

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

  const { data: currentUser } = useSWR("current-user", () =>
    authService.getProfile(),
  );

  const handleUserChatClick = (selectedChatId: string) => {
    // setSelectedUser(user);
    // setSelectedChatId(user.id);

    setSelectedChatIdForDetails(selectedChatId);
  };

  return (
    <div
      className="flex w-full bg-background overflow-hidden"
      style={{ height: "100dvh" }}
    >
      {/* Sidebar - Hidden on mobile if a user is selected */}
      <div className={sidebarClassName}>
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
      <div className={conversationClassName}>
        {selectedUser ? (
          messageLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Conversation
              chatId={selectedChatId}
              messages={messagesData?.data}
              initialNextCursor={messagesData?.nextCursor ?? null}
              selectedUser={selectedUser}
              chatType={selectedChatType}
              isLoading={messageLoading}
              onBack={isMobile ? () => setSelectedUser(null) : undefined}
              onUserClick={
                selectedChatId
                  ? () => handleUserChatClick(selectedChatId)
                  : undefined
              }
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

      {/* Chat Details Panel (3rd column) */}

      {/* Mobile bottom sheet */}

      {isMobile && (
        <div className="lg:hidden">
          <Sheet
            open={!!selectedChatIdForDetails}
            onOpenChange={(open) =>
              setSelectedChatIdForDetails(open ? selectedChatId : null)
            }
          >
            <SheetContent
              side="bottom"
              className="p-0 h-[85dvh] rounded-t-xl overflow-hidden"
            >
              <ChatDetailsPanel
                chat={selectedChat?.data as any}
                onClose={() => setSelectedChatIdForDetails(null)}
              />
            </SheetContent>
          </Sheet>
        </div>
      )}

      {selectedChatIdForDetails && (
        <div
          className={cn(
            "hidden lg:flex h-full w-[320px] max-w-[380px] border-l",
            !selectedUser && "opacity-60",
          )}
        >
          <ChatDetailsPanel
            chat={selectedChat?.data as any}
            onClose={() => setSelectedChatIdForDetails(null)}
          />
        </div>
      )}

      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
        isSubmitting={isMutating}
      />
    </div>
  );
}
